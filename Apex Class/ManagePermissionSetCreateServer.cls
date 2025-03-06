//This Method is Used to Create Permission Set and its related Object Permissions field Permissions, User Permissions and Tab setting;
//This Class referred In LWC - ManagePermissionSetCreate
public with sharing class ManagePermissionSetCreateServer {
    // Constants for reuse and maintenance
    private static final String ERROR_REQUIRED_PARAMS = 'Required parameters are missing';
    private static final String ERROR_INVALID_LICENSE = 'Invalid license configuration';
    private static final Integer BULK_BATCH_SIZE = 200;

    // This Method is used to check the dublicate Permission label and Api Name
    @AuraEnabled(cacheable=true)
    public static Boolean duplicatePermissionSetCheck(String label, String apiName) {
        if (String.isBlank(label) || String.isBlank(apiName)) {
            throw new IllegalArgumentException(ERROR_REQUIRED_PARAMS);
        }
        return [SELECT COUNT() FROM PermissionSet 
                WHERE Label = :label OR Name = :apiName LIMIT 1] > 0;
    }
    // This Method is used to get the user License based on userId
    @AuraEnabled(cacheable = true)
    public static Map<String, List<Map<String,String>>> getUserLicenseForUser(String userId) {
        Map<String,List<Map<String,String>>> userLicenseMap = new Map <String,List<Map<String,String>>>();
        List<User> userWithLicenseList = [SELECT Profile.UserLicense.Id, Profile.UserLicense.Name, Profile.UserLicense.MasterLabel FROM User WHERE Id =: userId LIMIT 1];
        if (!userWithLicenseList.isEmpty()) {
            User userWithLicense = userWithLicenseList[0];
            Map < String, String > recordMap = new Map < String, String > {'Id' => userWithLicense.Profile.UserLicense.Id,
                'Name' => userWithLicense.Profile.UserLicense.Name,'MasterLabel' => userWithLicense.Profile.UserLicense.MasterLabel};
                    userLicenseMap.put('UserLicense', new List<Map<String,String>> {recordMap});
        }
        return userLicenseMap;
    }
    //This Method is used to fetch the Users based on UserLicense/PermissioSetLicense
    @AuraEnabled(cacheable = true)
    public static List<User> getUsersBasedOnLicenseName(String licenseName) {
        List<User> userList = new List<User>();
        if (String.isBlank(licenseName)) {
            return [SELECT Id, Name, Username, Profile.Name, Profile.UserLicense.Name FROM User WHERE IsActive = TRUE];
        }
        List<UserLicense> userLicList = [SELECT Id, Name FROM UserLicense WHERE Name =: licenseName LIMIT 1];
        if (!userLicList.isEmpty()) {
            return [SELECT Id, Name, Username, Profile.Name, Profile.UserLicense.Name FROM User WHERE IsActive = TRUE AND Profile.UserLicenseId =: userLicList[0].Id];
        } else {
            Set<Id> assigneeIds = new Set<Id>();
            for (PermissionSetLicenseAssign permSetLic: [SELECT AssigneeId FROM PermissionSetLicenseAssign WHERE PermissionSetLicense.DeveloperName =: licenseName]) {
                assigneeIds.add(permSetLic.AssigneeId);
            }
            if (!assigneeIds.isEmpty()) {
                return [SELECT Id, Name, Username, Profile.Name, Profile.UserLicense.Name FROM User WHERE IsActive = TRUE AND Id IN: assigneeIds];
            }
        }
        return userList;
    }
    //This Method is used to intiate Create new permissionSet Based on Profile changes with Object or Field or RecordType or User or Tab Permissions
    @AuraEnabled
    public static PermissionSet createNewPermissionSet(Map<String,Object> newPermSet, 
                                                      List<Id> userIds,
                                                      Map<String, Map<String, Boolean>> objectPermissionsMap,
                                                      List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPerms,
                                                      String objName, 
                                                      String updateType, 
                                                      String tabToUpdate, 
                                                      Map<String, Boolean> userToUpdate,
                                                      List<PermissionAnalyzerRecordTypeServer.RecordTypeUpdateWrapper> recTypeToUpdate) {
        try {
            validateInputParameters(newPermSet, userIds);
            String permSetId = processPermissionSet(newPermSet, userIds, updateType);
            
            if (String.isNotBlank(permSetId)) {
                processPermissionUpdates(permSetId, updateType, objectPermissionsMap, 
                                      fieldPerms, objName, tabToUpdate, userToUpdate, 
                                      recTypeToUpdate);
            }

            return [SELECT Id, Name, NamespacePrefix, IsCustom, Description, 
                    PermissionSetGroupId, ProfileId, Type,
                    Profile.Name, Profile.UserType, Profile.Description, 
                    Profile.UserLicense.Name, License.Name, Label 
                    FROM PermissionSet 
                    WHERE Id = :permSetId];

        } catch (Exception e) {
            handleException('Error creating permission set', e);
            return null;
        }
    }

    private static void processPermissionUpdates(String permSetId, String updateType,
                                               Map<String, Map<String, Boolean>> objectPermissionsMap,
                                               List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPerms,
                                               String objName, String tabToUpdate,
                                               Map<String, Boolean> userToUpdate,
                                               List<PermissionAnalyzerRecordTypeServer.RecordTypeUpdateWrapper> recTypeToUpdate) {
        if (String.isBlank(permSetId)) return;

        switch on updateType?.toLowerCase() {
            when 'obj' {
                PermissionAnalyzerObjectServer.updateObjPermissions(objectPermissionsMap, permSetId);
            }
            when 'field' {
                PermissionAnalyzerObjectServer.updateFieldPermissions(fieldPerms, permSetId, objName, '');
            }
            when 'user' {
                UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(
                    permSetId, '', userToUpdate);
            }
            when 'tab' {
                createPermissionSetWithTabsAndUsers(newPermSet, tabToUpdate, userIds);
            }
            when 'recordtype' {
                createPermissionSetWithRecordTypeAndUsers(newPermSet, recTypeToUpdate, userIds);
            }
        }
    }

    private static void assignUsersToPermissionSet(Id permSetId, List<Id> userIds) {
        if (permSetId == null || userIds == null || userIds.isEmpty()) {
            return;
        }

        List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();
        for (Id userId : userIds) {
            assignments.add(new PermissionSetAssignment(
                AssigneeId = userId,
                PermissionSetId = permSetId
            ));
        }

        if (!assignments.isEmpty()) {
            Database.SaveResult[] results = Database.insert(assignments, false);
            handleDMLResults(results);
        }
    }

    //This Method is the helper method to deal create PermissionSet With TabSettings
    @AuraEnabled(cacheable=false)
    public static String createPermissionSetWithTabsAndUsers(Map<String, Object> permSetToCreate,  String tabSettingsJson, List<Id> userids) {
        UserAccessManager instance = new UserAccessManager();
        String persetapi;
        List<MetadataService.PermissionSet> persetToInsert = new List<MetadataService.PermissionSet>();
        MetadataService.PermissionSet insertPerset = new MetadataService.PermissionSet();
        insertPerset.fullName = ((String) permSetToCreate.get('Name')).replaceAll(' ', '_');
        insertPerset.label = (String) permSetToCreate.get('Label');
        insertPerset.description = (String) permSetToCreate.get('Description');
        insertPerset.license = (String) permSetToCreate.get('License');
        insertPerset.hasActivationRequired = (Boolean) permSetToCreate.get('hasActivationRequired');
        persetToInsert.add(insertPerset);
        if (!persetToInsert.isEmpty()) {
                MetadataService.UpsertResult[] results = (MetadataService.UpsertResult[]) instance.service.upsertMetadata(persetToInsert);
                for (MetadataService.UpsertResult upsertResult : results) {
                    persetapi = upsertResult.fullName;
                    handleUpsertResult(upsertResult);
                }
        }
        List<Map<String, String>> rawList = (List<Map<String, String>>) JSON.deserialize(tabSettingsJson, List<Map<String, String>>.class);
        List<TabPermissionAnalyzerServer.TabSettingsWrapper> tabSettings = getTabSettings(rawList);
        List<MetadataService.PermissionSet> permissionSets = (List<MetadataService.PermissionSet>) instance.service.readMetadata(
            'PermissionSet', new List<String>{ persetapi }).getRecords();    
        MetadataService.PermissionSet permissionSet;
        if (permissionSets.size() > 0) {
            permissionSet = buildPermissionSet(permissionSets, tabSettings);
        } 
        else {
            permissionSet = new MetadataService.PermissionSet();
            permissionSet.fullName = persetapi;
            permissionSet.tabSettings = getPermSetTabSettings(tabSettings);
        }
        // Update the PermissionSet metadata with tab settings
        MetadataService.SaveResult[] updateResults = instance.service.updateMetadata(new List<MetadataService.Metadata>{ permissionSet });
        handleSaveResult(updateResults);

        PermissionSet persetId = [SELECT Id, Name FROM PermissionSet WHERE Name = :persetapi LIMIT 1];
        List<PermissionSetAssignment> permSetAssignments = new List<PermissionSetAssignment>();
        for (Id userId : userids) {
            PermissionSetAssignment permSetAssignment = new PermissionSetAssignment();
            permSetAssignment.AssigneeId = userId;
            permSetAssignment.PermissionSetId = persetId.Id;
            permSetAssignments.add(permSetAssignment);
        }
        try {
            insert permSetAssignments;
        } catch (DmlException e) {
            throw new AuraHandledException('Error occurred while assigning permission set: ' + e.getMessage());
        }
        return persetId.Id;
    }

    private static MetadataService.PermissionSet buildPermissionSet(List<MetadataService.PermissionSet> permissionSets, List<TabPermissionAnalyzerServer.TabSettingsWrapper> tabSettings){
        MetadataService.PermissionSet permissionSet = permissionSets[0];
            if (permissionSet.tabSettings == null) {
                permissionSet.tabSettings = new List<MetadataService.PermissionSetTabSetting>();
            }
            // Collect tabs to remove
            Set<String> tabsToRemove = new Set<String>();
            for (TabPermissionAnalyzerServer.TabSettingsWrapper tabSettingWrapper : tabSettings) {
                String tabName = tabSettingWrapper.tab;
                String visibility = tabSettingWrapper.visibility;    
                if (visibility == null) {
                    tabsToRemove.add(tabName);
                } else {
                    Boolean tabFound = isTabFound(permissionSet.tabSettings, tabName, visibility);
                    // Add new tab setting if not found
                    if (!tabFound) {
                        MetadataService.PermissionSetTabSetting newTabSetting = new MetadataService.PermissionSetTabSetting();
                        newTabSetting.tab = tabName;
                        newTabSetting.visibility = visibility;
                        permissionSet.tabSettings.add(newTabSetting);
                    }
                }
            }
            // Remove tabs with null visibility
            permissionSet.tabSettings = getUpdatedTabSettings(permissionSet.tabSettings, tabsToRemove);

        return permissionSet;
    }

    //This method is called from buildPermissionSet to check if the given tab is available in existing tab permissions list
    private static Boolean isTabFound(List<MetadataService.PermissionSetTabSetting> psTabSettings, String tabName, String visibility){
        Boolean tabFound = false;
        for (MetadataService.PermissionSetTabSetting existingTabSetting : psTabSettings) {
            if (existingTabSetting.tab == tabName) {
                existingTabSetting.visibility = visibility;
                tabFound = true;
                break;
            }
        }
        return tabFound;
    }

    //This method is called from createPermissionSetWithTabsAndUsers to get updated tab settings of a permission set
    private static List<MetadataService.PermissionSetTabSetting> getUpdatedTabSettings(List<MetadataService.PermissionSetTabSetting> permissionSetTbSettings, Set<String> tabsToRemove){
        List<MetadataService.PermissionSetTabSetting> updatedTbSettings = new List<MetadataService.PermissionSetTabSetting>();
        for (MetadataService.PermissionSetTabSetting existingTabSetting : permissionSetTbSettings) {
                if (!tabsToRemove.contains(existingTabSetting.tab)) {
                    updatedTbSettings.add(existingTabSetting);
                }
            }
        return updatedTbSettings;
    }

    @TestVisible
    //This method is called from createPermissionSetWithTabsAndUsers to get tab settings of a permission set
    private static List<MetadataService.PermissionSetTabSetting> getPermSetTabSettings(List<TabPermissionAnalyzerServer.TabSettingsWrapper> tabSettings){
        List<MetadataService.PermissionSetTabSetting> tbSetting = new List<MetadataService.PermissionSetTabSetting>();

        for (TabPermissionAnalyzerServer.TabSettingsWrapper tabSettingWrapper : tabSettings) {
            if (tabSettingWrapper.visibility != null) {
                MetadataService.PermissionSetTabSetting newTabSetting = new MetadataService.PermissionSetTabSetting();
                newTabSetting.tab = tabSettingWrapper.tab;
                newTabSetting.visibility = tabSettingWrapper.visibility;
                tbSetting.add(newTabSetting);
            }
        }
        return tbSetting;
    }

    //Handling Save Results
    private static void handleSaveResult(List<MetadataService.SaveResult> saveResults){
        for (MetadataService.SaveResult result : saveResults) {
            if (!result.success) {
                for (MetadataService.Error error : result.errors) {
                    System.debug('Error: ' + error.message);
                }
            }
        } 
    }

    //Handling upsert errors
    private static void handleUpsertResult(MetadataService.UpsertResult result) {
        if (!result.success) {
            for (MetadataService.Error error : result.errors) {
                handleException('Error inserting Permission Set createPermissionSetWithTabsAndUsers: ' + error.message, null);            
            }
        } else {
            System.debug('Permission Set Inserted successfully for: ' + result.fullName);                    
        }
    }

    //This method is called from createPermissionSetWithTabsAndUsers to get Tab Settings
    private static List<TabPermissionAnalyzerServer.TabSettingsWrapper> getTabSettings(List<Map<String, String>> rawList){
        List<TabPermissionAnalyzerServer.TabSettingsWrapper> tabSetting = new List<TabPermissionAnalyzerServer.TabSettingsWrapper>();
        for (Map<String, String> item : rawList) {
            for (String tabName : item.keySet()) {
                String visibility = item.get(tabName); 
                TabPermissionAnalyzerServer.TabSettingsWrapper wrapper = new TabPermissionAnalyzerServer.TabSettingsWrapper(tabName,visibility);
                tabSetting.add(wrapper);
            }
        }
        return tabSetting;
    }    

    // Handling Upsert Results
    private static void handleUpsertResults(MetadataService.UpsertResult[] results) {
        for (MetadataService.UpsertResult result: results) {
            if (!result.success) {
                handleException('Error inserting Permission Set handleUpsertResults: ' + result.errors[0].message, null);
            }
        }
    }    
    @TestVisible
    private static void handleException(String message, Exception e) {
        String errorMessage = e == null ? message : message + ': ' + e.getMessage();
        throw new AuraHandledException(errorMessage);
    }
    //This Method is the helper method to deal create PermissionSet with RecordType
    public static String createPermissionSetWithRecordTypeAndUsers(Map<String, Object> newPermSet,
                                                                   List<PermissionAnalyzerRecordTypeServer.RecordTypeUpdateWrapper> recTypeToUpdate,List <String> userIds) {
                                                                       UserAccessManager instance = new UserAccessManager();
                                                                       String permSetApi = ((String) newPermSet.get('Name')).replaceAll(' ', '_');
                                                                       MetadataService.PermissionSet insertPermSet = createPermissionSet(newPermSet);
                                                                           MetadataService.UpsertResult[] results = (MetadataService.UpsertResult[]) instance.service.upsertMetadata(new List<MetadataService.PermissionSet> {
                                                                               insertPermSet});
                                                                           handleUpsertResults(results);
                                                                       MetadataService.PermissionSet permissionSet = getPermissionSet(instance, permSetApi);
                                                                       updateRecordTypeVisibilities(permissionSet, recTypeToUpdate);
                                                                           MetadataService.SaveResult[] saveResults = instance.service.updateMetadata(new List < MetadataService.Metadata > {permissionSet});
                                                                           handleSaveResults(saveResults);                                                                       
                                                                       List<PermissionSet> permSetId = [SELECT Id FROM PermissionSet WHERE Name = :permSetApi LIMIT 1];
                                                                       if (!permSetId.isEmpty()) {
                                                                           assignUsersToPermissionSet(permSetId[0].Id, userIds);
                                                                           return permSetId[0].Id;
                                                                       } else {
                                                                           throw new AuraHandledException('Permission Set not found: ' + permSetApi);
                                                                       }
    }    
    private static MetadataService.PermissionSet createPermissionSet(Map < String, Object > permSetToCreate) {
        MetadataService.PermissionSet permSet = new MetadataService.PermissionSet();
        permSet.fullName = ((String) permSetToCreate.get('Name')).replaceAll(' ', '_');
        permSet.label = (String) permSetToCreate.get('Label');
        permSet.description = (String) permSetToCreate.get('Description');
        permSet.license = (String) permSetToCreate.get('License');
        permSet.hasActivationRequired = (Boolean) permSetToCreate.get('hasActivationRequired');
        return permSet;
    }
    @TestVisible    
    private static void updateRecordTypeVisibilities(MetadataService.PermissionSet permissionSet, List < PermissionAnalyzerRecordTypeServer.RecordTypeUpdateWrapper > recTypeToUpdate) {
        Map <String,MetadataService.PermissionSetRecordTypeVisibility> existingVisibilities = new Map <String,MetadataService.PermissionSetRecordTypeVisibility>();
        for (MetadataService.PermissionSetRecordTypeVisibility visibility: permissionSet.recordTypeVisibilities) {
            existingVisibilities.put(visibility.recordType, visibility);
        }
        for (PermissionAnalyzerRecordTypeServer.RecordTypeUpdateWrapper recUpdate: recTypeToUpdate) {
            MetadataService.PermissionSetRecordTypeVisibility visibility = existingVisibilities.get(recUpdate.RecordType);
            if (visibility == null) {
                visibility = new MetadataService.PermissionSetRecordTypeVisibility();
                visibility.recordType = recUpdate.RecordType;
                permissionSet.recordTypeVisibilities.add(visibility);
            }
            visibility.visible = recUpdate.Visible;
        }
    }
    private static void handleSaveResults(MetadataService.SaveResult[] results) {
        for (MetadataService.SaveResult result: results) {
            if (!result.success) {
                handleException('Error updating Permission Set: ' + result.errors[0].message, null);
            }
        }
    }
}