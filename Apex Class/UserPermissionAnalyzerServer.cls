//This CLass is used to Maintain User Permissions for Users
//Used in UserPermissionAnalyzer - LWC
public with sharing class UserPermissionAnalyzerServer {
    // Constants
    private static final String ERROR_INVALID_INPUT = 'Invalid input parameters';
    private static final String ERROR_PERMISSION_NOT_FOUND = 'Permission object not found';
    private static final Integer QUERY_LIMIT = 50000;
    private static final String PERMISSIONS_PREFIX = 'Permissions';
    
    // Cache for frequently used data
    private static Map<String, Map<String, Schema.SObjectField>> fieldMapCache = 
        new Map<String, Map<String, Schema.SObjectField>>();
    
    // Error handling
    private static String errorMessage;
    
    public class FormattedUserPermissions {
        @AuraEnabled public final String fieldName { get; private set; }
        @AuraEnabled public final String fieldLabel { get; private set; }
        @AuraEnabled public Object fieldValue { get; private set; }
        
        public FormattedUserPermissions(String fieldName, String fieldLabel, Object fieldValue) {
            this.fieldName = fieldName;
            this.fieldLabel = fieldLabel;
            this.fieldValue = fieldValue;
        }
    }
    public class UserPermissionsWrapper{
        @AuraEnabled public List < FormattedUserPermissions > combinedWrapper { get; set; }
        @AuraEnabled public List < Object > permDependency { get; set; }        
        public UserPermissionsWrapper(List < FormattedUserPermissions > combinedWrapper, List < Object > permDependency) {
            this.combinedWrapper = combinedWrapper;
            this.permDependency = permDependency;
        }
    }
    //Get the Selected User's Profile, PermissionSet, PermissioSetGroup Userpermissions
    @AuraEnabled
    public static UserPermissionsWrapper getCombinedUserPermissionsForUser(List<String> permissionSetIds) {
        if (permissionSetIds == null || permissionSetIds.isEmpty()) {
            throw new AuraHandledException(ERROR_INVALID_INPUT);
        }

        try {
            List<FormattedUserPermissions> permissionFields = getPermissionFields();
            Map<String, Boolean> finalPermissionValues = getPermissionValues(permissionSetIds, 
                new Set<String>(getPermissionFieldNames(permissionFields)));
            
            List<FormattedUserPermissions> combinedPermissions = 
                combinePermissions(permissionFields, finalPermissionValues);
                
            return new UserPermissionsWrapper(
                combinedPermissions, 
                getUserPermissionUserDependency()
            );
        } catch (Exception e) {
            handleException('Error getting combined permissions', e);
            return null;
        }
    }

    private static Map<String, Boolean> getPermissionValues(
        List<String> permissionSetIds, 
        Set<String> permissionFieldNames
    ) {
        String query = 'SELECT ' + String.join(new List<String>(permissionFieldNames), ', ') +
            ' FROM PermissionSet WHERE Id IN :permissionSetIds';
            
        Map<String, Boolean> finalPermissionValues = new Map<String, Boolean>();
        
        for (PermissionSet ps : Database.query(query)) {
            for (String fieldName : permissionFieldNames) {
                Boolean fieldValue = (Boolean)ps.get(fieldName);
                if (!finalPermissionValues.containsKey(fieldName) || fieldValue) {
                    finalPermissionValues.put(fieldName, fieldValue);
                }
            }
        }
        return finalPermissionValues;
    }

    //Get the UserPermissios User Dependencies.
    public static List < Object > getUserPermissionUserDependency() {
        UserAccessManager instance = new UserAccessManager();
        String query = 'SELECT Id, RequiredPermission, Permission FROM PermissionDependency WHERE RequiredPermissionType = \'User Permission\' AND PermissionType = \'User Permission\'';
        String endPoint = URL.getOrgDomainUrl().toExternalForm() + '/services/data/v58.0/tooling/query/?q=' + EncodingUtil.urlEncode(query, 'UTF-8');
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endPoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + instance.partnerConnection.SessionHeader.sessionId);
        req.setHeader('Content-Type', 'application/json');
        try {
            Http http = new Http();
            HttpResponse res = http.send(req);
            if (res.getStatusCode() == 200) {
                Map < String, Object > results = (Map < String, Object > ) JSON.deserializeUntyped(res.getBody());
                return (List < Object > ) results.get('records');
            } else {
                System.debug('Response: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        return new List < Object > ();
    }    
    public class MutePermissionsOfPermSetGrpWrapper {
        @AuraEnabled public String muteId { get; set; }
        @AuraEnabled public List < Map < String, Object >> mutePermissions { get; set; }        
        public MutePermissionsOfPermSetGrpWrapper(String muteId, List < Map < String, Object >> mutePermissions) {
            this.muteId = muteId;
            this.mutePermissions = mutePermissions;
        }
    }
    //Get Muted UserPermissions for PermissionSetGroup
    @AuraEnabled
    public static MutePermissionsOfPermSetGrpWrapper getMutedUserPermissionOfPermSetGrp(String groupId, String fieldNames, List < Map < String, Object >> userPermissions) {
        if (String.isBlank(groupId)) {
            return new MutePermissionsOfPermSetGrpWrapper(null, new List < Map < String, Object >> ());
        }
        String permSetId = getOrCreateMutingPermissionSetId(groupId);
        if (String.isBlank(permSetId)) {
            return new MutePermissionsOfPermSetGrpWrapper(null, new List < Map < String, Object >> ());
        }
        List < Map < String, Object >> mutingUserPermissions = getMutingUserPermissions(permSetId, fieldNames, userPermissions);
        return new MutePermissionsOfPermSetGrpWrapper(permSetId, mutingUserPermissions);
    }
    private static String getOrCreateMutingPermissionSetId(String groupId) {
        List<PermissionSetGroupComponent> psgg = [SELECT PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId =: groupId AND(NOT PermissionSet.Name LIKE '%_%') LIMIT 1];
        if (!psgg.isEmpty()) {
            return psgg[0].PermissionSetId;
        }
        List< PermissionSetGroup> permSetGrp = [SELECT MasterLabel, DeveloperName FROM PermissionSetGroup WHERE Id =: groupId LIMIT 1];
        if (permSetGrp.isEmpty()) {
            return null;
        }
        try {
            MutingPermissionSet mutePerm = new MutingPermissionSet(
                MasterLabel = permSetGrp[0].MasterLabel + ' Muted',
                DeveloperName = permSetGrp[0].DeveloperName + '_Muted'
            );
            insert mutePerm;
            PermissionSetGroupComponent component = new PermissionSetGroupComponent(
                PermissionSetGroupId = groupId,
                PermissionSetId = mutePerm.Id
            );
            insert component;
            return mutePerm.Id;
        } catch (DmlException e) {
            return null;
        }
    }
    private static List < Map < String, Object >> getMutingUserPermissions(String permSetId, String fieldNames, List < Map < String, Object >> userPermissions) {
        String query = 'SELECT Id, ' + fieldNames + ' FROM MutingPermissionSet WHERE Id = \'' + permSetId + '\' LIMIT 1';
        MutingPermissionSet mutePerm = Database.query(query);
        if (mutePerm == null) {
            return new List < Map < String, Object >> ();
        }
        List < Map < String, Object >> mutingUserPermissions = new List < Map < String, Object >> ();
        for (Map < String, Object > obj: userPermissions) {
            Object fieldValueMute = mutePerm.get((String) obj.get('fieldName'));
            Map < String, Object > newObj = new Map < String, Object > (obj);
            newObj.put('fieldValueMute', fieldValueMute);
            mutingUserPermissions.add(newObj);
        }
        return mutingUserPermissions;
    }
    //This Method is Used to retrieve User Permission Origins
    @AuraEnabled 
    public static Map < String, List < String >> getSelectedUserPermissionOrigins(String permissionType, List < String > permSetIds) {
        Map < String, List < String >> userPermEnabledPermSets = new Map < String, List < String >> ();
        if (permSetIds.isEmpty()) {
            return userPermEnabledPermSets;
        }
        String query = 'SELECT Id, Type, Name, Profile.Name FROM PermissionSet WHERE Id IN :permSetIds AND ' + permissionType + ' = true';
        for (PermissionSet permSet: Database.query(query)) {
            String key;
            String value;
            
            if (permSet.Type == 'Profile') {
                key = 'Profile';
                value = permSet.Profile.Name;
            } else if (permSet.Type == 'Group') {
                key = 'Group';
                value = permSet.Name;
            } else {
                key = 'PermissionSet';
                value = permSet.Name;
            }
            
            if (!userPermEnabledPermSets.containsKey(key)) {
                userPermEnabledPermSets.put(key, new List < String > ());
            }
            userPermEnabledPermSets.get(key).add(value);
        }
        return userPermEnabledPermSets;
    }
    //Update User Permissions of Profile/permissionSet and also this method is used to mute permissionSetgroup
    @AuraEnabled
    public static Map<String, Boolean> updateUserPermissionsforProfOrPermSetOrMuteGroups(
        String permSetId, 
        String profileName, 
        Map<String, Boolean> systemPermissions
    ) {
        if (String.isBlank(permSetId) || systemPermissions == null || systemPermissions.isEmpty()) {
            throw new AuraHandledException(ERROR_INVALID_INPUT);
        }

        try {
            // Validate CRUD permissions
            if (!Schema.sObjectType.PermissionSet.isUpdateable()) {
                throw new AuraHandledException('Insufficient permissions to update PermissionSet');
            }

            SObject permissionObject = getPermissionObject(permSetId);
            validatePermissionObject(permissionObject);
            
            if (permissionObject instanceof PermissionSet && 
                ((PermissionSet)permissionObject).Type == 'Profile') {
                return profileUserPermissionsUpdate(
                    new List<String>{ profileName }, 
                    systemPermissions
                );
            } else {
                updatePermissionSetOrMutePermSetGrp(permissionObject, systemPermissions);
                return systemPermissions;
            }
        } catch (Exception e) {
            handleException('Error updating system permissions', e);
            return null;
        }
    }
    private static SObject getPermissionObject(String permSetId) {
        List < PermissionSet > perms = [SELECT Id, Type FROM PermissionSet WHERE Id =: permSetId LIMIT 1];
        if (!perms.isEmpty()) {
            return perms[0];
        }
        
        List < MutingPermissionSet > mutePerms = [SELECT Id FROM MutingPermissionSet WHERE Id =: permSetId LIMIT 1];
        if (!mutePerms.isEmpty()) {
            return mutePerms[0];
        }
        handleException(ERROR_PERMISSION_NOT_FOUND, null);
        return null;
    }
    //Used to update Profile user Permissions
    @AuraEnabled
    public static Map<String, Boolean> profileUserPermissionsUpdate(List<String> profileNames, Map<String, Boolean> systemPermissions) {
        UserAccessManager instance = new UserAccessManager();
        Map<String, Boolean> updatedResultForProfile = new Map<String, Boolean>();
        List<MetadataService.Profile> profilesList = (List<MetadataService.Profile>) instance.service.readMetadata('Profile', profileNames).getRecords();
        List<MetadataService.Profile> profilesToUpdate = fetchProfilesToUpdate(profilesList, systemPermissions);
        
        MetadataService.UpsertResult[] results = instance.service.upsertMetadata(profilesToUpdate);
        for (MetadataService.UpsertResult upsertResult : results) {
            if (!upsertResult.success) {
                handleUpsertError(upsertResult);
            } else {
                System.debug('Profile updated successfully for: ' + upsertResult.fullName);
                updatedResultForProfile = getProfileResult(profilesToUpdate);
            }
        }
        return updatedResultForProfile;
    }
    // This method is called from profileUserPermissionsUpdate to extract profiles that needs to be updated
    private static List<MetadataService.Profile> fetchProfilesToUpdate(List<MetadataService.Profile> profilesToUpdate, Map<String, Boolean> systemPermissions){
        List<MetadataService.Profile> newProfilesList = new List<MetadataService.Profile>();
        for (MetadataService.Profile profile : profilesToUpdate) {
            MetadataService.Profile updatedProfile = new MetadataService.Profile();
            updatedProfile.fullName = profile.fullName;
            updatedProfile.userPermissions = new List<MetadataService.ProfileUserPermission>();
            
            for (String permissionName : systemPermissions.keySet()) {
                MetadataService.ProfileUserPermission userPermission = new MetadataService.ProfileUserPermission();
                userPermission.name = permissionName;
                userPermission.enabled = systemPermissions.get(permissionName);
                updatedProfile.userPermissions.add(userPermission);
            }
            newProfilesList.add(updatedProfile);
        }
        return newProfilesList;
    }
    // This method is called from profileUserPermissionsUpdate to iterate and return formatted profile result from profiles list
    private static Map<String, Boolean> getProfileResult(List<MetadataService.Profile> profilesList){
        Map<String, Boolean> result = new Map<String, Boolean>();
        for (MetadataService.Profile updateProf : profilesList) {
            if (updateProf.userPermissions != null) {
                for (MetadataService.ProfileUserPermission updateProfUser : updateProf.userPermissions) {
                    result.put(updateProfUser.name, updateProfUser.enabled);
                }
            }
        }
        return result;
    }
    
    private static void handleUpsertError(MetadataService.UpsertResult upsertResult) {
        for (MetadataService.Error error: upsertResult.errors) {
            System.debug('Error: ' + error.message + ' Status Code: ' + error.statusCode);
            errorMessage = error.message;
            if (error.fields != null) {
                for (String field: error.fields) {
                    System.debug('Error Field: ' + field);
                }
            }
        }
        handleException('Error updating profile: ' + errorMessage, null);
    }
    //This Method used to Update UserPermissions for PermissionSet and Also used to update MutingPermissionSet for  Group  
    private static void updatePermissionSetOrMutePermSetGrp(SObject permOrMutingPermSet, Map < String, Boolean > systemPermissions) {
        Map<String,Boolean> checkAccessLevelForPermSetUpdate = PermissionAnalyzerServer.getObjDefinition('PermissionSet');
        if(checkAccessLevelForPermSetUpdate.get('Update')){
            for (String key: systemPermissions.keySet()) {
                permOrMutingPermSet.put('Permissions' + key, systemPermissions.get(key));
            }
            update permOrMutingPermSet;
        }
    }
    private static void handleException(String message, Exception e) {
        String fullMessage = e == null ? message : message + ': ' + e.getMessage();
        System.debug(LoggingLevel.ERROR, fullMessage);
        errorMessage = fullMessage;
        throw new AuraHandledException(fullMessage);
    }
}