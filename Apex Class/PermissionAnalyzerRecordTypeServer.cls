//This Method is user to Fetch RecordType Permissions or Profile/Permissionset
//Used in LWC Component ==> PermissionAnalyzerRecordType
public with sharing class PermissionAnalyzerRecordTypeServer {  
    public permissionPartnerSoapSforceCom.Soap partnerConnection;
    public MetadataService.MetadataPort service;
    public class GetRecTypeVisibilityResutlWrapper {
        @AuraEnabled public List<RecordType> recordTypeList { get; set; }
        @AuraEnabled public Map<String, Object> recordTypeVisibility { get; set; }
        public GetRecTypeVisibilityResutlWrapper(List<RecordType> recordTypeList, Map<String, Object> recordTypeVisibility){
            this.recordTypeList = recordTypeList;
            this.recordTypeVisibility = recordTypeVisibility != null? recordTypeVisibility: new Map<String, Object>();
        }
    }
    // Constants
    private static final String ERROR_MISSING_PARAMS = 'Required parameters are missing';
    private static final String ERROR_METADATA_UPDATE = 'Error updating metadata: {0}';
    private static final Integer QUERY_LIMIT = 50000;
    private static final String PERSON_ACCOUNT_PREFIX = 'PersonAccount.';
    
    // Cache to improve performance
    private static Map<String, List<RecordType>> recordTypeCache = new Map<String, List<RecordType>>();
    
    //This Method used to Dynamically called the RecordType Visibility for profil and PermissionSet    
    @AuraEnabled
    public static GetRecTypeVisibilityResutlWrapper getRecTypeVisibilityForProfileAndPermSet(
        String objName,
        String permissionSetId,
        String profileOrPermissionSetType,
        List<String> profileOrPermSetName
    ) {
        // Input validation
        if (String.isBlank(objName) || profileOrPermSetName == null || profileOrPermSetName.isEmpty()) {
            throw new AuraHandledException(ERROR_MISSING_PARAMS);
        }

        try {
            Map<String, Object> recordTypeVisibility = new Map<String, Object>();
            if (String.isNotBlank(permissionSetId)) {
                recordTypeVisibility = getRecordTypeVisibility(
                    profileOrPermSetName, 
                    objName, 
                    profileOrPermissionSetType
                );
            }

            // Use cached record types if available
            List<RecordType> recordTypes;
            if (recordTypeCache.containsKey(objName)) {
                recordTypes = recordTypeCache.get(objName);
            } else {
                recordTypes = [
                    SELECT Id, Name, DeveloperName, NamespacePrefix
                    FROM RecordType
                    WHERE SobjectType = :objName 
                    LIMIT :QUERY_LIMIT
                ];
                recordTypeCache.put(objName, recordTypes);
            }

            return new GetRecTypeVisibilityResutlWrapper(recordTypes, recordTypeVisibility);
        } catch (Exception e) {
            handleException('Error retrieving record type visibility', e);
            return null;
        }
    }
    //This Method is used to Fetch RecordType Visibility for Profile
    @AuraEnabled
    public static Map <String,Object> getRecordTypeVisibilityForProfile(List < String > profileNames, String sObjName) {
        UserAccessManager instance = new UserAccessManager();
        Map <String,Object> profileRecTypeMap = new Map < String, Object > ();
        try {
            List < MetadataService.Profile > profiles = (List < MetadataService.Profile > ) instance.service.readMetadata('Profile', profileNames).getRecords();
            if (profiles != null) {
                profileRecTypeMap = getRecordTypeVisibilityForProfileHelper(profiles,sObjName);
            }
        } catch (Exception e) {
            handleException('An error occurred while fetching RecordType Permissions through Profile: ', e);
        }        
        return profileRecTypeMap;
    }
    //This is helper Method for getRecordTypeVisibilityForProfile
    private static Map <String,Object> getRecordTypeVisibilityForProfileHelper(List < MetadataService.Profile > profiles, String sObjName){
        Map <String,Object> profileRecTypeMap = new Map < String, Object > ();
        for (MetadataService.Profile prof: profiles) {
            if (prof.recordTypeVisibilities != null) {
                for (MetadataService.ProfileRecordTypeVisibility visibility: prof.recordTypeVisibilities) {
                    String recordType = visibility.recordType;
                    if (recordType.startsWith(sObjName + '.') || recordType.startsWith('PersonAccount.')) {
                        profileRecTypeMap.put(recordType, new Map < String, Object > {
                            'RecordType' => recordType,
                                'Visible' => visibility.visible,
                                'Default_x' => visibility.default_x
                                });
                    }
                }
            }
        }
        return profileRecTypeMap;
    }
    //This Method is used to Fetch RecordType Visibility for PermissionSet
    @AuraEnabled
    public static Map < String, Object > getRecordTypeVisibilityForPermSet(List < String > permissionsSetNames, String sObjName) {
        UserAccessManager instance = new UserAccessManager();
        Map < String, Object > permissionSetRecTypeMap = new Map < String, Object > ();
        try {
            List < MetadataService.PermissionSet > permissionSets = (List < MetadataService.PermissionSet > ) instance.service.readMetadata('PermissionSet', permissionsSetNames).getRecords();
            if (permissionSets != null) {
                permissionSetRecTypeMap = getRecordTypeVisibilityForPermSetHelper(permissionSets,sObjName);
            }
        } catch (Exception e) {
            handleException('An error occurred while fetching RecordType Permissions through permission Sets: ', e);
        }
        return permissionSetRecTypeMap;
    }   
    //This is helper Method for getRecordTypeVisibilityForPermSet
    private static Map <String,Object> getRecordTypeVisibilityForPermSetHelper(List < MetadataService.PermissionSet > permissionSets, String sObjName){
        Map < String, Object > permissionSetRecTypeMap = new Map < String, Object > ();
        for (MetadataService.PermissionSet permissionSet: permissionSets) {
            if (permissionSet.recordTypeVisibilities != null) {
                for (MetadataService.PermissionSetRecordTypeVisibility visibility: permissionSet.recordTypeVisibilities) {
                    String recordType = visibility.recordType;
                    if (recordType.startsWith(sObjName + '.') || recordType.startsWith('PersonAccount.')) {
                        permissionSetRecTypeMap.put(recordType, new Map < String, Object > {
                            'RecordType' => recordType,
                                'Visible' => visibility.visible
                                });
                    }
                }
            }
        }
        return permissionSetRecTypeMap;
    }
    public class RecordTypeUpdateWrapper {
        @AuraEnabled Public String RecordType { get; set; }
        @AuraEnabled Public Boolean Visible { get; set; }
        @AuraEnabled Public String label { get; set; }
        @AuraEnabled Public String developerName { get; set; }
        @AuraEnabled Public Boolean Default_x { get; set; }
        Public RecordTypeUpdateWrapper() {}
    }
    //This Method used to initiate Update Process for Profile Or PermissionSet
    @AuraEnabled
    public static List<RecordTypeUpdateWrapper> updateRecordTypeVisibility(
        List<RecordTypeUpdateWrapper> recordTypeVisibility,
        List<String> profileOrPermSetNames,
        String profileOrPermissionSetType
    ) {  
        // Input validation
        if (recordTypeVisibility == null || recordTypeVisibility.isEmpty() || 
            profileOrPermSetNames == null || profileOrPermSetNames.isEmpty()) {
            throw new AuraHandledException(ERROR_MISSING_PARAMS);
        }

        try {
            UserAccessManager instance = new UserAccessManager();
            String metadataType = (profileOrPermissionSetType == 'Profile') ? 'Profile' : 'PermissionSet';
            
            // Bulkify metadata operations
            List<MetadataService.Metadata> metadata = instance.service.readMetadata(
                metadataType, 
                profileOrPermSetNames
            ).getRecords();

            if (profileOrPermissionSetType == 'Profile') {
                updateRecordTypeVisibilityForProfile(
                    (List<MetadataService.Profile>)metadata, 
                    recordTypeVisibility
                );
            } else {
                updateRecordTypeVisibilityForPermSet(
                    profileOrPermSetNames, 
                    recordTypeVisibility
                );
            }

            return recordTypeVisibility;
        } catch (Exception e) {
            handleException('Error updating record type visibility', e);
            return null;
        }
    }
    //This Method is used to Update Record Type Visibility for Profile
    private static Boolean updateRecordTypeVisibilityForProfile(List < MetadataService.Profile > profiles, List < RecordTypeUpdateWrapper > recordTypeVisibility) {
        UserAccessManager instance = new UserAccessManager();
        List < MetadataService.Profile > profilesToUpdate = new List < MetadataService.Profile > ();
        Map < String, RecordTypeUpdateWrapper > wrapperMap = new Map < String, RecordTypeUpdateWrapper > ();
        for (RecordTypeUpdateWrapper wrapper: recordTypeVisibility) {
            wrapperMap.put(wrapper.RecordType, wrapper);
        }
        for (MetadataService.Profile profile: profiles) {
            MetadataService.Profile updatedProfile = new MetadataService.Profile();
            updatedProfile.fullName = profile.fullName;
            updatedProfile.recordTypeVisibilities = new List < MetadataService.ProfileRecordTypeVisibility > ();
            Map < String, MetadataService.ProfileRecordTypeVisibility > existingVisibilities = new Map < String, MetadataService.ProfileRecordTypeVisibility > ();
            if (profile.recordTypeVisibilities != null) {
                for (MetadataService.ProfileRecordTypeVisibility visibility: profile.recordTypeVisibilities) {
                    existingVisibilities.put(visibility.recordType, visibility);
                }
            }
            for (String recordType : wrapperMap.keySet()) {
                RecordTypeUpdateWrapper wrapper = wrapperMap.get(recordType);
                MetadataService.ProfileRecordTypeVisibility visibility;
                if (existingVisibilities.containsKey(recordType)) {
                    visibility = existingVisibilities.get(recordType);
                } else {
                    visibility = new MetadataService.ProfileRecordTypeVisibility();
                    visibility.recordType = recordType;  
                }
                visibility.visible = !!wrapper.Visible;
                visibility.default_x = wrapper.Default_x ?? false;
                updatedProfile.recordTypeVisibilities.add(visibility);
            }
            profilesToUpdate.add(updatedProfile);
        }
        List < MetadataService.UpsertResult > results = instance.service.upsertMetadata(profilesToUpdate);
        return handleUpsertResults(results);
    }
    //This Method is used to handle Profile Upsert Result  
    private static Boolean handleUpsertResults(List < MetadataService.UpsertResult > results) {
        List < String > errorMessages = new List < String > ();
        List < String > successMessages = new List < String > ();
        for (MetadataService.UpsertResult upsertResult: results) {
            if (!upsertResult.success) {
                String errorMessage = 'Error updating profile or permission set: ' + upsertResult.fullName + ' - ';
                for (MetadataService.Error error: upsertResult.errors) {
                    errorMessage += error.message + ' (Status Code: ' + error.statusCode + ')';
                    if (error.fields != null && !error.fields.isEmpty()) {
                        errorMessage += ' Fields: ' + String.join(error.fields, ', ');
                    }
                }
                handleException(errorMessage , null);
            } else {
                successMessages.add('Record type visibilities updated successfully for: ' + upsertResult.fullName);
            }
        }
        if (!errorMessages.isEmpty()) {
            throw new AuraHandledException(String.join(errorMessages, '\n'));
        }
        return true;
    }
    //This Method is used to Update Record Type Visibility for PermissionSet
    @AuraEnabled
    public static List < RecordTypeUpdateWrapper > updateRecordTypeVisibilityForPermSet(List < String > permissionSetNames, List < RecordTypeUpdateWrapper > recordTypeUpdates) {        
        UserAccessManager instance = new UserAccessManager();
        Map < String, RecordTypeUpdateWrapper > updateMap = new Map < String, RecordTypeUpdateWrapper > ();
        for (RecordTypeUpdateWrapper rtUpdate: recordTypeUpdates) {
            updateMap.put(rtUpdate.RecordType, rtUpdate);
        }
        MetadataService.Metadata[] metadataArray = instance.service.readMetadata('PermissionSet', permissionSetNames).getRecords();
        List < MetadataService.PermissionSet > permissionSetsToUpdate = new List < MetadataService.PermissionSet > ();
        for (MetadataService.Metadata metadata: metadataArray) {
            MetadataService.PermissionSet permissionSet = (MetadataService.PermissionSet) metadata;
            if (permissionSet != null) {
                if (permissionSet.recordTypeVisibilities == null) {
                    permissionSet.recordTypeVisibilities = new List < MetadataService.PermissionSetRecordTypeVisibility > ();
                }
                permissionSet = updateRecordTypeVisibilityForPermSetHelper(permissionSet, updateMap);
                permissionSetsToUpdate.add(permissionSet);
            }
        }
        if (!permissionSetsToUpdate.isEmpty()) {
            MetadataService.SaveResult[] saveResults = instance.service.updateMetadata(permissionSetsToUpdate);
            handleSaveResults(saveResults);
        }
        return recordTypeUpdates;
    }
    //This is helper method for updateRecordTypeVisibilityForPermSet
    private static MetadataService.PermissionSet updateRecordTypeVisibilityForPermSetHelper(MetadataService.PermissionSet permissionSetToUpdate, Map < String, RecordTypeUpdateWrapper > updateMap){
        Map < String, MetadataService.PermissionSetRecordTypeVisibility > existingVisibilities = new Map < String, MetadataService.PermissionSetRecordTypeVisibility > ();
        for (MetadataService.PermissionSetRecordTypeVisibility visibility: permissionSetToUpdate.recordTypeVisibilities) {
            existingVisibilities.put(visibility.recordType, visibility);
        }
        for (String recordType: updateMap.keySet()) {
            RecordTypeUpdateWrapper rtUpdate = updateMap.get(recordType);
            MetadataService.PermissionSetRecordTypeVisibility visibility;                        
            if (existingVisibilities.containsKey(recordType)) {
                visibility = existingVisibilities.get(recordType);
                visibility.visible = rtUpdate.Visible;
            } else {
                visibility = new MetadataService.PermissionSetRecordTypeVisibility();
                visibility.recordType = recordType;
                visibility.visible = rtUpdate.Visible;
                permissionSetToUpdate.recordTypeVisibilities.add(visibility);
            }
        }
        return permissionSetToUpdate;
    }
    //This is helper Method to handle the exceptions for recordtype visibilities
    private static void handleException(String message, Exception e) {
        String fullMessage = String.format(
            ERROR_METADATA_UPDATE, 
            new List<String>{ e != null ? e.getMessage() : message }
        );
        throw new AuraHandledException(fullMessage);
    }
    //This is the helper Method to handle save result for recordtype visibilities
    private static void handleSaveResults(MetadataService.SaveResult[] saveResults) {
        List < String > errors = new List < String > ();
        for (MetadataService.SaveResult saveResult: saveResults) {
            if (!saveResult.success) {
                errors.add('Error updating permission set ' + saveResult.fullName + ': ' + saveResult.errors[0].message);
            } else {
                System.debug('Permission set updated successfully: ' + saveResult.fullName);
            }
        }
        if (!errors.isEmpty()) {
            handleException(String.join(errors, '\n'), null);
        }
    }
}