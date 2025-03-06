//This class is used for edit,delete,update Profiles.
public with Sharing class ProfileManager {
    private static final String ERROR_MESSAGE = 'Error: ';
    private static final Integer QUERY_LIMIT = 5000;
    //This method is used to fetch profile Name
    @AuraEnabled(cacheable=true)
    public static List<String> getProfileName(String profileId) {
        // Input validation
        if (String.isBlank(profileId)) {
            throw new AuraHandledException('Profile ID cannot be blank');
        }
        
        try {
            UserAccessManager instance = new UserAccessManager();
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            // Use named credentials instead of direct session ID
            String endPoint = baseUrl + '/services/data/v58.0/tooling/query/?q=' + 
                EncodingUtil.urlEncode('SELECT Id, Name, FullName FROM Profile WHERE Id=\'' + String.escapeSingleQuotes(profileId) + '\'', 'UTF-8');
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endPoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + instance.partnerConnection.SessionHeader.sessionId);
            req.setHeader('Content-Type', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return processProfileResponse(res.getBody());
            } else {
                throw new AuraHandledException('HTTP Request failed: ' + res.getStatus());
            }
        } catch (Exception e) {
            handleException('Error retrieving profile name', e);
            return null;
        }
    }
    // This method is used to update profile properties
    @AuraEnabled
    public static String updateProfile(String profileName, String newDescription) {
       return PermissionAnalyzerServer.editProfileProperties(profileName,newDescription);
    }  
    //This method is used to clone Profile
    @AuraEnabled
    public static PermissionSet cloneProfile(String profileName,String newProfileName, String newDescription){
        List<PermissionSet> clonedProfile = new List<PermissionSet>();
            UserAccessManager instance = new UserAccessManager();
            List < MetadataService.Profile > profiles = (List < MetadataService.Profile > ) instance.service.readMetadata('Profile', new List < String > {
                profileName
                    }).getRecords();
            if (profiles.isEmpty() || profiles[0].fullName == null) {
                throw new AuraHandledException('Profile not found');
            }
            MetadataService.Profile updatedProfile = new MetadataService.Profile();
            updatedProfile.fullName = newProfileName;
            updatedProfile.description = newDescription;
            updatedProfile.userLicense = profiles[0].userLicense;
            updatedProfile.fieldPermissions  = profiles[0].fieldPermissions;
            updatedProfile.objectPermissions = profiles[0].objectPermissions;
            updatedProfile.recordTypeVisibilities = profiles[0].recordTypeVisibilities; 
            updatedProfile.userPermissions = profiles[0].userPermissions;
            updatedProfile.applicationVisibilities  = profiles[0].applicationVisibilities;
            updatedProfile.classAccesses = profiles[0].classAccesses;
            updatedProfile.pageAccesses  = profiles[0].pageAccesses;
            MetadataService.UpsertResult[] results = instance.service.upsertMetadata(new List < MetadataService.Profile > {
                updatedProfile });
            if (!results[0].success) {
                handleException('Error updating profile: ' + ': ' + results[0].errors[0].message,  null);
            }else{
                clonedProfile = [Select Id,ProfileId, Profile.Name, IsCustom, Profile.Description, Profile.UserType, Profile.UserLicense.Name from PermissionSet where Profile.Name =: results[0].fullName];
            } 
        return clonedProfile.isEmpty() ? null : clonedProfile[0];
    }
    //This method is used for delete functionality in profile
    @AuraEnabled
    public static Void deleteProfile(String profileName) {
        UserAccessManager instance = new UserAccessManager();
        MetadataService.DeleteResult[] deleteResults = instance.service.deleteMetadata('Profile',new List<String>{ profileName });
        for (MetadataService.DeleteResult deleteResult : deleteResults) {
            if (!deleteResult.success) {
                for (MetadataService.Error error : deleteResult.errors) {
                    throw new AuraHandledException('An error occurred while deleting Profile: ' + error.message);
                }
            }
        }
    }    
    //Wrapper class to fetch users list & profile name
    public class UserAndProfileDetails {
        @Auraenabled
        public List<User> userList { get; set; }
        @Auraenabled
        public String profileName { get; set; }
        public UserAndProfileDetails(List<User> userList, String profileName) {
            this.userList = userList;
            this.profileName = profileName;
        }
    }    
    //This method is used to fetch profile related users
    @AuraEnabled(cacheable=true)
    public static UserAndProfileDetails getProfileusers(String profId) {
        return new UserAndProfileDetails([SELECT id, Name, Username, Profile.UserLicense.Name, IsActive FROM user WHERE ProfileId = :profId AND IsActive = TRUE ORDER BY Name ASC LIMIT 5000],ProfileManager.getProfileName(profId)[0]);
    }    
    //This method retrieves permission sets associated with profiles.
    @AuraEnabled(cacheable=true)
    public static List<PermissionSet> getProfileDetails() {
        try {
            return [
                SELECT Id, ProfileId, Profile.Name, Profile.UserLicense.Name, 
                       Profile.Description, Profile.UserType, IsOwnedByProfile, isCustom 
                FROM Permissionset 
                WHERE IsOwnedByProfile = TRUE 
                ORDER BY Profile.Name ASC 
                LIMIT :QUERY_LIMIT
            ];
        } catch(Exception e) {
            handleException('Error retrieving profile details', e);
            return null;
        }
    }    
    //This method retrieves tab visibility settings for each profile.
    @AuraEnabled
    public static List<Map<String, Object>> getProfileTabSetting(List<String> profileName) {
        List<Map<String, Object>> tabSettingMapList = new List<Map<String, Object>>();
        Map<String, String> tabVisibilities = getTabPermissions(profileName);
        List<TabDefinition> tabDefList = [SELECT id, Name, Label FROM TabDefinition ORDER BY Label ASC];
        if (!tabDefList.isEmpty()) {
            for (TabDefinition tabDef : tabDefList) {
                Map<String, Object> tabSettingMap = new Map<String, Object>();
                tabSettingMap.put('Label', tabDef.Label);
                tabSettingMap.put('Name', tabDef.Name);
                tabSettingMap.put('Visibility', tabVisibilities.get(tabDef.Name));
                tabSettingMapList.add(tabSettingMap);
            }
        }
        return tabSettingMapList;
    }	
    // Method to retrieve tab visibility settings for specified profiles and return them as a map of tab names and visibility settings
    @AuraEnabled
    public static Map < String, String > getTabPermissions(List < String > profileNames) {
        UserAccessManager instance = new UserAccessManager();
        Map < String, String > tabSettingObj = new Map < String, String > ();
        try {
            List < MetadataService.Profile > profiles = (List < MetadataService.Profile > ) instance.service.readMetadata('Profile', profileNames).getRecords();
            if (profiles != null) {
                for (MetadataService.Profile prof: profiles) {
                    if (prof.tabVisibilities != null) {
                        for (MetadataService.ProfileTabVisibility tabVisibility: prof.tabVisibilities) {
                            tabSettingObj.put(tabVisibility.tab, tabVisibility.visibility);
                        }
                    }
                }
            }
        } catch (Exception e) {
            handleException('Error processing tab permissions: ', e);
        }        
        return tabSettingObj;
    }    
    //This method retrieves Object details for each profile.
    @AuraEnabled
    public static ProfileObjectPermissionsWrapper getSobjectPermissionsForProfile(String permSetId, String objName) {
        List < Object > dependObjects = PermissionAnalyzerObjectServer.checkObjectPermissionDependencies(objName);
        return new ProfileObjectPermissionsWrapper(
            ProfileManager.checkSObjType(objName),
            dependObjects
        );
    }  
    //This Methos retrieves Permissions details for each Profile.
    @AuraEnabled
    public static List<Map<String, Object>> getFieldPermissionsForProfile(String permSetId, String objName){
        Map < String, Boolean > fieldAccess = ProfileManager.checkFieldType(objName);      
        Map < String, Map < String, Object >> fieldDefMapByName = ProfileManager.getFieldDefinitionProfile(objName); 
        Map < String, FieldPermissions > fieldPermissionsMap = new Map < String, FieldPermissions > ();
        for (FieldPermissions fieldPerm: [SELECT Field, PermissionsRead, PermissionsEdit
                                          FROM FieldPermissions
                                          WHERE ParentId =: permSetId AND SObjectType =: objName
                                         ]) {
                                             fieldPermissionsMap.put(fieldPerm.Field, fieldPerm);
                                         }       
       List < Map < String, Object >> fieldPermissionsMapList = new List < Map < String, Object >> ();
       for (String fieldKey: fieldDefMapByName.keySet()) {
            Map < String, Object > fieldDefMap = fieldDefMapByName.get(fieldKey);
            if ((Boolean) fieldDefMap.get('isPermissionable') && fieldAccess.get(fieldKey) == true) {
                Map < String, Object > fieldPermissionMap = new Map < String, Object > {
                    'Field' => fieldKey,
                        'label' => fieldDefMap.get('Label'),
                        'hasEditAccess' => fieldDefMap.get('isCalculated')
                        };
                FieldPermissions fieldPerm = fieldPermissionsMap.get(fieldKey);
                if (fieldPerm != null) {
                    fieldPermissionMap.put('PermissionsRead', fieldPerm.PermissionsRead);
                    fieldPermissionMap.put('PermissionsEdit', fieldPerm.PermissionsEdit);
                } else {
                    fieldPermissionMap.put('PermissionsRead', false);
                    fieldPermissionMap.put('PermissionsEdit', false);
                }
                fieldPermissionsMapList.add(fieldPermissionMap);
            }
        }   
        return fieldPermissionsMapList;
    }
    //Wrapper class to fetch object & field permissions.
    public class ProfileObjectPermissionsWrapper {
        @AuraEnabled public final Boolean hasObjAccess;
        @AuraEnabled public final List<Object> dependentObj;
        public ProfileObjectPermissionsWrapper(Boolean hasObjAccess, List<Object> dependentObj) {
            this.hasObjAccess = hasObjAccess;
            this.dependentObj = dependentObj;
        }
    }
    //Helper to get the valid fields for updating ObjectPermissions.
    @AuraEnabled
    public static Map < String, Boolean > checkFieldType(String sObjName) {
        Map<String, Boolean> fieldMap = new Map<String, Boolean>();
        for (Schema.PicklistEntry p : fieldPermissions.Field.getDescribe().getPicklistValues()) {
            if (sObjName == p.getValue().split('\\.')[0]) {
                fieldMap.put(p.getValue(), true);
            }
        }
        return fieldMap;
    }
    //Helper to get valid field name
    @AuraEnabled
    public static Map<String, Map<String, Object>> getFieldDefinitionProfile(String objectName) {        
        Map<String, Map<String, Object>> fieldDefMapByName = new Map<String, Map<String, Object>>();
        Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
        for (Schema.SObjectField field : describeResult.fields.getMap().values()) {
            Map<String, Object> fieldDefMap = new Map<String, Object>();
            fieldDefMap.put('Label', field.getDescribe().getLabel());
            fieldDefMap.put('Name', field.getDescribe().getName());
            fieldDefMap.put('isPermissionable',field.getDescribe().isPermissionable());
            fieldDefMap.put('isCalculated', field.getDescribe().isCalculated());
            String fieldNameKey = objectName + '.' + field.getDescribe().getName();
            fieldDefMapByName.put(fieldNameKey, fieldDefMap);
        }
        return fieldDefMapByName;
    }      
    //Helper to get valid sobject.
    @AuraEnabled
    public static Boolean checkSObjType(String sObjName) {
        for (Schema.PicklistEntry p : objectPermissions.SObjectType.getDescribe().getPicklistValues()) {
            if (sObjName == p.getValue()) {
                return true;
            }
        }
        return false;
    }
    //Wrapper class for user permissions & its dependencies.
    public class PermissionFieldWrap {
        @AuraEnabled public List < Map < String, Object >> userPermissions { get; set; }
        @AuraEnabled public List < Object > systemDependencies { get; set; }
        @AuraEnabled public Map < String, Object > objectPermissions { get; set; }
        public PermissionFieldWrap() {
            this.userPermissions = new List < Map < String, Object >> ();
            this.systemDependencies = new List < Object > ();
            this.objectPermissions = new Map < String, Object > ();
        }
    }    
    //This method is used to retrieve system permissions & its dependencies of profile.
    @AuraEnabled(cacheable = true)
    public static PermissionFieldWrap getCombinedPermissionsforProfile(String permissionSetIds) {
        PermissionFieldWrap permissionWrap = new PermissionFieldWrap();  
        permissionWrap.userPermissions = getUserPermissions(permissionSetIds);
        List < Object > dependSystemPermissions = UserPermissionAnalyzerServer.getUserPermissionUserDependency();
        permissionWrap.systemDependencies = dependSystemPermissions;  
        Set < String > dependentObjects = extractDependentObjects(dependSystemPermissions); 
        Map < String, Map < String, Object >> objectPermissionsMap = getObjectPermissions(permissionSetIds, dependentObjects);
        permissionWrap.objectPermissions = objectPermissionsMap;        
        return permissionWrap;
    }
    // Method to retrieve user permissions for a specified permission set ID and return them as a list of maps with field names, labels, and values
    private static List < Map < String, Object >> getUserPermissions(String permissionSetIds) {
        List < Map < String, Object >> userPermissionsList = new List < Map < String, Object >> ();        
        String query = 'SELECT Id, Name, ' + String.join(getPermissionFields(), ', ') + 
            ' FROM PermissionSet WHERE Id = \'' + permissionSetIds + '\'';        
        for (PermissionSet ps: Database.query(query)) {
            for (String fieldName: getPermissionFields()) {
                userPermissionsList.add(new Map < String, Object > {
                    'fieldName' => fieldName,
                        'fieldLabel' => Schema.SObjectType.PermissionSet.fields.getMap().get(fieldName).getDescribe().getLabel(),
                        'fieldValue' => ps.get(fieldName)
                        });
            }
        }        
        return userPermissionsList;
    } 
    // Method to get a list of permission fields from the PermissionSet object, filtering for fields that start with 'Permissions' and excluding 'Permissionsetgroupid'
    private static List < String > getPermissionFields() {
        List < String > permissionFields = new List < String > ();
        for (Schema.SObjectField field: Schema.SObjectType.PermissionSet.fields.getMap().values()) {
            String fieldName = field.getDescribe().getName();
            if (fieldName.startsWith('Permissions') && fieldName != 'Permissionsetgroupid') {
                permissionFields.add(fieldName);
            }
        }
        return permissionFields;
    }
    @TestVisible
    private static Set < String > extractDependentObjects(List < Object > dependSystemPermissions) {
        Set < String > dependentObjects = new Set < String > ();
        for (Object record: dependSystemPermissions) {
            Map < String, Object > recordMap = (Map < String, Object > ) record;
            if ((String) recordMap.get('RequiredPermissionType') == 'Object Permission') {
                String requiredPermission = (String) recordMap.get('RequiredPermission');
                dependentObjects.add(requiredPermission.split('<')[0]);
            }
        }
        return dependentObjects;
    }  
    @TestVisible
    private static Map < String, Map < String, Object >> getObjectPermissions(String permissionSetIds, Set < String > dependentObjects) {
        Map < String, Map < String, Object >> objectPermissionsMap = new Map < String, Map < String, Object >> ();
        for (ObjectPermissions objPerm: [SELECT SObjectType, PermissionsRead, PermissionsCreate, PermissionsEdit,
                                         PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords
                                         FROM ObjectPermissions
                                         WHERE ParentId =: permissionSetIds AND SObjectType IN: dependentObjects
                                        ]) {
                                            objectPermissionsMap.put(objPerm.SObjectType, new Map < String, Object > {
                                                'PermissionsCreate' => objPerm.PermissionsCreate,
                                                    'PermissionsRead' => objPerm.PermissionsRead,
                                                    'PermissionsEdit' => objPerm.PermissionsEdit,
                                                    'PermissionsDelete' => objPerm.PermissionsDelete,
                                                    'PermissionsViewAllRecords' => objPerm.PermissionsViewAllRecords,
                                                    'PermissionsModifyAllRecords' => objPerm.PermissionsModifyAllRecords
                                                    });
                                        }
        return objectPermissionsMap;
    }    
   
    @AuraEnabled
    //This method is used to update system permissions & its dependencies in profile.
    public static Map<String, Boolean> updateSystemPermissionsProf(String profileName,Map<String, Boolean> systemPermissions) {
        Map<String, Boolean> updatedResult = UserPermissionAnalyzerServer.profileUserPermissionsUpdate(new List<String>{ profileName },systemPermissions);  
        return updatedResult;
    }    
    //Wrapper class for object level permissions.
    public class ProfileObjectDetails {
        @AuraEnabled public final List<EntityDefinition> entityDefList;
        @AuraEnabled public final Map<String, Object> objectPermissions;
        public ProfileObjectDetails(List<EntityDefinition> entityDefList, Map<String, Object> objectPermissions) {
            this.entityDefList = entityDefList;
            this.objectPermissions = objectPermissions;
        }
    } 
    //This method is used to retrieve object-level permissions for a specific profile.
    @AuraEnabled
    public static ProfileObjectDetails getProfileObjectDetails(String permId) {
        Map < String, Map < String, Boolean >> objectPermissionsMap = new Map < String, Map < String, Boolean >> ();        
        if (String.isNotBlank(permId)) {
            for (ObjectPermissions objPerm: [
                SELECT SObjectType, PermissionsRead, PermissionsCreate, PermissionsEdit,
                PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords
                FROM ObjectPermissions
                WHERE ParentId =: permId
            ]) {
                objectPermissionsMap.put(objPerm.SObjectType, new Map < String, Boolean > {
                    	'PermissionsCreate' => objPerm.PermissionsCreate,
                        'PermissionsRead' => objPerm.PermissionsRead,
                        'PermissionsEdit' => objPerm.PermissionsEdit,
                        'PermissionsDelete' => objPerm.PermissionsDelete,
                        'PermissionsViewAllRecords' => objPerm.PermissionsViewAllRecords,
                        'PermissionsModifyAllRecords' => objPerm.PermissionsModifyAllRecords
                        });
            }
        }        
        return new ProfileObjectDetails([
            SELECT Id, Label, QualifiedApiName, NameSpacePrefix
            FROM EntityDefinition
            WHERE DefaultCompactLayoutId != NULL
        ], objectPermissionsMap);
    }    
    private static void handleException(String message, Exception e) {
        String fullMessage = e == null ? message : message + ': ' + e.getMessage();
        throw new AuraHandledException(fullMessage);
    }
	//This is a method to check duplicate label before creating Profile.
    @AuraEnabled(cacheable=true)
    public static Boolean checkDuplicateProfile(String label) {
        return [SELECT COUNT() FROM Profile WHERE Name = :label] > 0;
    }  
   	//This Is a method to create the permissionsset with profile
    @AuraEnabled
    public static void getProfilePermsToCovertPermSet(String profileName,Map<String,Object> permSetToCreate){
        UserAccessManager instance = new UserAccessManager();
        List < MetadataService.Profile > profiles = (List < MetadataService.Profile > ) instance.service.readMetadata('Profile', new List < String > {
            profileName}).getRecords();
        if (profiles.isEmpty() || profiles[0].fullName == null) {
            throw new AuraHandledException('Profile not found');
        }
        List<MetadataService.PermissionSet> persetToInsert = new List<MetadataService.PermissionSet>();
        MetadataService.PermissionSet permissionSet = new MetadataService.PermissionSet();
        permissionSet.fullName = ((String) permSetToCreate.get('Name')).replaceAll(' ', '_');
        permissionSet.label = (String) permSetToCreate.get('Label');
        permissionSet.description = (String) permSetToCreate.get('Description');
        permissionSet.license = profiles[0].userLicense;
        permissionSet.hasActivationRequired = (Boolean) permSetToCreate.get('hasActivationRequired');
        if (profiles[0].objectPermissions != null) {            
            permissionSet.objectPermissions = objPermsProfToPermSet(profiles);
        }
        if (profiles[0].applicationVisibilities != null) {            
            permissionSet.applicationVisibilities = appVisibilityPermsProfToPermSet(profiles);
        }
        if (profiles[0].classAccesses != null) {            
            permissionSet.classAccesses = classAccessPermsProfToPermSet(profiles);
        }
        if (profiles[0].pageAccesses != null) {            
            permissionSet.pageAccesses = pageAccessProfToPermSet(profiles);
        }
        if (profiles[0].fieldPermissions  != null){            
            permissionSet.fieldPermissions = fieldPermsProfToPermSet(profiles);
        }
        if (profiles[0].userPermissions != null) {            
            permissionSet.userPermissions = userPermProfToPermSet(profiles);
        }
        if (profiles[0].recordTypeVisibilities != null) {            
            permissionSet.recordTypeVisibilities = recTypeProfToPermSet(profiles);
        }
        if (profiles[0].tabVisibilities != null) {            
            permissionSet.tabSettings = tabProfToPermSet(profiles); 
        }
        persetToInsert.add(permissionSet);
        MetadataService.UpsertResult[] results = (MetadataService.UpsertResult[]) instance.service.upsertMetadata(persetToInsert);
        if (!results[0].success) {
            throw new AuraHandledException('Error updating profile: ' + ': ' + results[0].errors[0].message);
        }else{
            System.debug('New PermissionSet :: ' + results[0].fullName);
        }         
    }    
    //Helper Method for Object Permission add profile to permissionSet
    public static List<MetadataService.PermissionSetObjectPermissions> objPermsProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetObjectPermissions> psObjectPermissions = new List<MetadataService.PermissionSetObjectPermissions>();
        for (MetadataService.ProfileObjectPermissions profileObjPerm : profiles[0].objectPermissions) {
            MetadataService.PermissionSetObjectPermissions psObjPerm = new MetadataService.PermissionSetObjectPermissions();
            psObjPerm.object_x = profileObjPerm.object_x;
            psObjPerm.allowCreate = profileObjPerm.allowCreate;
            psObjPerm.allowDelete = profileObjPerm.allowDelete;
            psObjPerm.allowEdit = profileObjPerm.allowEdit;
            psObjPerm.allowRead = profileObjPerm.allowRead;
            psObjPerm.modifyAllRecords = profileObjPerm.modifyAllRecords;
            psObjPerm.viewAllRecords = profileObjPerm.viewAllRecords;
            psObjectPermissions.add(psObjPerm);
        }
        return psObjectPermissions;
    }
    //Helper Method for Field Permission add Profile to PermissionSet
    public static List<MetadataService.PermissionSetFieldPermissions> fieldPermsProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetFieldPermissions> psFieldPermissions = new List<MetadataService.PermissionSetFieldPermissions>();
        for (MetadataService.ProfileFieldLevelSecurity profileFieldPerm : profiles[0].fieldPermissions) {
            MetadataService.PermissionSetFieldPermissions psFieldPerm = new MetadataService.PermissionSetFieldPermissions();
            psFieldPerm.field = profileFieldPerm.field;
            psFieldPerm.readable = profileFieldPerm.readable;
            psFieldPerm.editable = profileFieldPerm.editable;
            psFieldPermissions.add(psFieldPerm);
        }
        return psFieldPermissions;
    }
    //Helper Method for applicationVisibilities add Profile to PermissionSet
    public static List<MetadataService.PermissionSetApplicationVisibility> appVisibilityPermsProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetApplicationVisibility> psAppVisibilities = new List<MetadataService.PermissionSetApplicationVisibility>();
        for (MetadataService.ProfileApplicationVisibility profileAppVis : profiles[0].applicationVisibilities) {
            MetadataService.PermissionSetApplicationVisibility psAppVis = new MetadataService.PermissionSetApplicationVisibility();
            psAppVis.application = profileAppVis.application;
            psAppVis.visible = profileAppVis.visible;
            psAppVisibilities.add(psAppVis);
        }
        return psAppVisibilities;
    }
    //Helper Method for Class Access add Profile to PermissionSet
    public static List<MetadataService.PermissionSetApexClassAccess> classAccessPermsProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetApexClassAccess> psClassAccesses = new List<MetadataService.PermissionSetApexClassAccess>();
        for (MetadataService.ProfileApexClassAccess profileClassAccess : profiles[0].classAccesses) {
            MetadataService.PermissionSetApexClassAccess psClassAccess = new MetadataService.PermissionSetApexClassAccess();
            psClassAccess.apexClass = profileClassAccess.apexClass;
            psClassAccess.enabled = profileClassAccess.enabled;
            psClassAccesses.add(psClassAccess);
        }
        return psClassAccesses;
    }
    //Helper Method for Page Access add profile to permissionSet
    public static List<MetadataService.PermissionSetApexPageAccess> pageAccessProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetApexPageAccess> psPageAccesses = new List<MetadataService.PermissionSetApexPageAccess>();
        for (MetadataService.ProfileApexPageAccess profilePageAccess : profiles[0].pageAccesses) {
            MetadataService.PermissionSetApexPageAccess psPageAccess = new MetadataService.PermissionSetApexPageAccess();
            psPageAccess.apexPage = profilePageAccess.apexPage;
            psPageAccess.enabled = profilePageAccess.enabled;
            psPageAccesses.add(psPageAccess);
        }
        return psPageAccesses;
    }
    //Helper Method for User Permissions add Profile to PermissionSet
    public static List<MetadataService.PermissionSetUserPermission> userPermProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetUserPermission> psUserPermissions = new List<MetadataService.PermissionSetUserPermission>();
        for (MetadataService.ProfileUserPermission profileUserPerm : profiles[0].userPermissions) {
            MetadataService.PermissionSetUserPermission psUserPerm = new MetadataService.PermissionSetUserPermission();
            psUserPerm.name = profileUserPerm.name;
            psUserPerm.enabled = profileUserPerm.enabled;
            psUserPermissions.add(psUserPerm);
        }
        return psUserPermissions;
    }
    //Helper Method for RecordType Visibility add Profile to PermissionSet
    public static List<MetadataService.PermissionSetRecordTypeVisibility> recTypeProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetRecordTypeVisibility> psRecordTypeVisibilities = new List<MetadataService.PermissionSetRecordTypeVisibility>();
        for (MetadataService.ProfileRecordTypeVisibility profileRTV : profiles[0].recordTypeVisibilities) {
            MetadataService.PermissionSetRecordTypeVisibility psRTV = new MetadataService.PermissionSetRecordTypeVisibility();
            psRTV.recordType = profileRTV.recordType;
            psRTV.visible = profileRTV.visible;
            psRecordTypeVisibilities.add(psRTV);
        }
        return psRecordTypeVisibilities;
    }
    //Helper Method for Tab Visibility add Profile to PermissionSet
    public static List<MetadataService.PermissionSetTabSetting> tabProfToPermSet(List < MetadataService.Profile > profiles){
        List<MetadataService.PermissionSetTabSetting> psTabSettings = new List<MetadataService.PermissionSetTabSetting>();
        for (MetadataService.ProfileTabVisibility profileTabVisibility : profiles[0].tabVisibilities) {
            	if(profileTabVisibility.visibility == 'DefaultOn' || profileTabVisibility.visibility == 'DefaultOff'){
                    MetadataService.PermissionSetTabSetting psTabSetting = new MetadataService.PermissionSetTabSetting();
                    psTabSetting.tab = profileTabVisibility.tab;
                    if(profileTabVisibility.visibility == 'DefaultOn'){
                        psTabSetting.visibility = 'Visible'; 
                    }
                    if(profileTabVisibility.visibility == 'DefaultOff'){
                        psTabSetting.visibility = 'Available'; 
                    }
                    psTabSettings.add(psTabSetting);
                }
            }
        return psTabSettings;
    }

    private static void bulkifyPermissionUpdates(List<MetadataService.PermissionSet> permissions) {
        if(permissions == null || permissions.isEmpty()) {
            return;
        }
        
        List<MetadataService.PermissionSet> bulkUpdates = new List<MetadataService.PermissionSet>();
        for(MetadataService.PermissionSet perm : permissions) {
            // Process in batches of 10
            if(bulkUpdates.size() == 10) {
                processPermissionBatch(bulkUpdates);
                bulkUpdates.clear();
            }
            bulkUpdates.add(perm);
        }
        if(!bulkUpdates.isEmpty()) {
            processPermissionBatch(bulkUpdates);
        }
    }
}