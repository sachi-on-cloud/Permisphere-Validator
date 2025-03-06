//This class is used to Handling tab setting permissions For Profile And PermissionSet.
//This Class referred In LWC --> tabPermissionAnalyzer
public with sharing class TabPermissionAnalyzerServer {
    // Constants
    private static final Integer QUERY_LIMIT = 50000;
    private static final String ERROR_INVALID_INPUT = 'Invalid input parameters';
    private static final String CACHE_KEY_PREFIX = 'TAB_VISIBILITY_';
    
    // Cache for tab definitions
    private static Map<String, List<TabDefinition>> tabDefinitionCache = new Map<String, List<TabDefinition>>();
    
    //This Method is used to retrieve TabSettings Permissions for Profile Or Permission, Try to Combine with TabDefinition for Name and label
    @AuraEnabled
    public static List < Map < String, Object >> getProfileOrPermSetTabVisibility(List < String > profileOrPermissionSetName, String typeProfileOrPermissionSet) {
        // Input validation
        if (profileOrPermissionSetName == null || profileOrPermissionSetName.isEmpty() || 
            String.isBlank(typeProfileOrPermissionSet)) {
            throw new AuraHandledException(ERROR_INVALID_INPUT);
        }

        try {
            Map<String, String> tabVisibilities = typeProfileOrPermissionSet == 'Profile' ?
                tabVisibilityRetrieverForProfile(profileOrPermissionSetName) :
                tabVisibilityRetrieverForPermissionSet(profileOrPermissionSetName);

            return buildTabVisibilityResult(tabVisibilities);
        } catch (Exception e) {
            handleException('Error retrieving tab visibility', e);
            return null;
        }
    }

    private static List<Map<String, Object>> buildTabVisibilityResult(Map<String, String> tabVisibilities) {
        List<Map<String, Object>> result = new List<Map<String, Object>>();
        
        // Cache tab definitions query
        if (!tabDefinitionCache.containsKey('all')) {
            tabDefinitionCache.put('all', [
                SELECT Id, Name, Label 
                FROM TabDefinition 
                ORDER BY Label ASC 
                LIMIT :QUERY_LIMIT
            ]);
        }

        for (TabDefinition tabDef : tabDefinitionCache.get('all')) {
            result.add(new Map<String, Object>{
                'Label' => tabDef.Label,
                'Name' => tabDef.Name,
                'Visibility' => tabVisibilities.get(tabDef.Name)
            });
        }
        return result;
    }

    //This is helper method to fetch the permissions of TabSetting for Profile Using MetaAPI
    @AuraEnabled
    public static Map < String, String > tabVisibilityRetrieverForProfile(List < String > profileNames) {
        UserAccessManager instance = new UserAccessManager();
        Map < String, String > tabVisibilityMap = new Map < String, String > ();
        try {
            List < MetadataService.Profile > profiles = (List < MetadataService.Profile > ) instance.service.readMetadata('Profile', profileNames).getRecords();
            if (profiles != null && !profiles.isEmpty()) {
                for (MetadataService.Profile prof: profiles) {
                    if (prof.tabVisibilities != null) {
                        for (MetadataService.ProfileTabVisibility tabVisibility: prof.tabVisibilities) {
                            tabVisibilityMap.put(tabVisibility.tab, tabVisibility.visibility);
                        }
                    }
                }
            }
        } catch (Exception e) {
            handleException('Error retrieving tab visibility: ', e);
        }
        return tabVisibilityMap;
    }
    @TestVisible
    private static void handleException(String message, Exception e) {
        String fullMessage = e == null ? message : message + ': ' + e.getMessage();
        System.debug(LoggingLevel.ERROR, fullMessage);
        throw new AuraHandledException(fullMessage);
    }
    //This is helper method to fetch the permissions of TabSetting for PermissionSet Using MetaAPI  
    @AuraEnabled
    public static Map < String, String > tabVisibilityRetrieverForPermissionSet(List < String > permissionSetNames) {
        UserAccessManager instance = new UserAccessManager();
        Map < String, String > tabVisibilityMap = new Map < String, String > ();
        try {
            List < MetadataService.PermissionSet > permissionSets = (List < MetadataService.PermissionSet > ) instance.service.readMetadata('PermissionSet', permissionSetNames).getRecords();
            if (permissionSets != null && !permissionSets.isEmpty()) {
                for (MetadataService.PermissionSet permSet: permissionSets) {
                    if (permSet.tabSettings != null) {
                        for (MetadataService.PermissionSetTabSetting tabSetting: permSet.tabSettings) {
                            tabVisibilityMap.put(tabSetting.tab, tabSetting.visibility);
                        }
                    }
                }
            }
        } catch (Exception e) {
            handleException('Error retrieving tab visibility: ', e);
        }
        return tabVisibilityMap;
    }
    //This is Methos Used to updated TabVIsibility for Profile Using MetadataAPI
    public class TabSettingsWrapper {
        public String tab;
        public String visibility;
        public TabSettingsWrapper(String tab, String visibility) {
            this.tab = tab;
            this.visibility = visibility;
        }
    }
    @AuraEnabled
    Public Static List<TabSettingsWrapper> updatePermissionSetTabVisibilities(String tabSettingsJson, String persetname) {
        List<Map<String, String>> tabSettingRawList = (List<Map<String, String>>) JSON.deserialize(tabSettingsJson, List<Map<String, String>>.class);
        List<TabSettingsWrapper> tabVisibilityWrapper = new List<TabSettingsWrapper>();    
        // Convert the raw list into TabSettingsWrapper list
        for (Map<String, String> item : tabSettingRawList) {
            for (String tabName : item.keySet()) {   
                // Create the wrapper object
                tabVisibilityWrapper.add(new TabSettingsWrapper(tabName, item.get(tabName)));
            }
        }    
        return helperUpdateClassForPermissionset(tabVisibilityWrapper, persetname);
    }
    @AuraEnabled
    Public Static List<TabSettingsWrapper> helperUpdateClassForPermissionset(List<TabSettingsWrapper> tabSettingsResult,String persetname) {
         UserAccessManager instance = new UserAccessManager();
        List<MetadataService.PermissionSet> permissionSets = (List<MetadataService.PermissionSet>) instance.service.readMetadata('PermissionSet',new List<String>{ persetname }).getRecords();    
        MetadataService.PermissionSet permissionSet;
        if (permissionSets.size() > 0) {
            permissionSet = permissionSets[0]; 
            if (permissionSet.tabSettings == null) {
                permissionSet.tabSettings = new List<MetadataService.PermissionSetTabSetting>();
            } 
            permissionSet.tabSettings = updateExistingHelper(permissionSet,tabSettingsResult);
        } else {
            permissionSet = new MetadataService.PermissionSet();
            permissionSet.fullName = persetname;
            permissionSet.tabSettings = new List<MetadataService.PermissionSetTabSetting>();    
            for (TabSettingsWrapper tabSettingWrapper : tabSettingsResult) {
                if (tabSettingWrapper.visibility != null) {
                    MetadataService.PermissionSetTabSetting newTabSetting = new MetadataService.PermissionSetTabSetting();
                    newTabSetting.tab = tabSettingWrapper.tab;
                    newTabSetting.visibility = tabSettingWrapper.visibility;
                    permissionSet.tabSettings.add(newTabSetting);
                }
            }
        }    
        // Update the PermissionSet metadata
        MetadataService.SaveResult[] results = instance.service.updateMetadata(new List<MetadataService.Metadata>{ permissionSet });
        handleSaveResult(results);
        return tabSettingsResult;
    }    
    //Helper Method for updating Exisiting tab Permissions
    private static List<MetadataService.PermissionSetTabSetting> updateExistingHelper(MetadataService.PermissionSet permissionSet, List<TabSettingsWrapper> tabSettingsResult){
        Set<String> tabsToRemove = new Set<String>();
        for (TabSettingsWrapper tabSettingWrapper : tabSettingsResult) {
            String tabName = tabSettingWrapper.tab;
            String visibility = tabSettingWrapper.visibility;
            if (visibility == null) {
                tabsToRemove.add(tabName);
            } else {
                Boolean tabFound = false;
                for (MetadataService.PermissionSetTabSetting existingTabSetting : permissionSet.tabSettings) {
                    if (existingTabSetting.tab == tabName) {
                        existingTabSetting.visibility = visibility;
                        tabFound = true;
                        break;
                    }
                }    
                // Add new tab setting if not found
                if (!tabFound) {
                    MetadataService.PermissionSetTabSetting newTabSetting = new MetadataService.PermissionSetTabSetting();
                    newTabSetting.tab = tabName;
                    newTabSetting.visibility = visibility;
                    permissionSet.tabSettings.add(newTabSetting);
                }
            }
        }  
        
        return updateExistingHelper1(permissionSet,tabsToRemove);
    }
    //Helper Method for updating Exisiting 1 tab Permissions
    private static List<MetadataService.PermissionSetTabSetting> updateExistingHelper1(MetadataService.PermissionSet permissionSet, Set<String> tabsToRemove){
        List<MetadataService.PermissionSetTabSetting> updatedTabSettings = new List<MetadataService.PermissionSetTabSetting>();
        for (MetadataService.PermissionSetTabSetting existingTabSetting : permissionSet.tabSettings) {
            if (!tabsToRemove.contains(existingTabSetting.tab)) {
                updatedTabSettings.add(existingTabSetting);
            }
        }
        return updatedTabSettings;
    }
    
    // Handling Save Results
    private static void handleSaveResult(List<MetadataService.SaveResult> saveResultList){
        for (MetadataService.SaveResult result: saveResultList) {
            if (!result.success) {
                handleErrorMessages(result.errors);
            }
        }
    }
    //This is Methos Used to updated TabVIsibility for Profile Using MetadataAPI
    @AuraEnabled
    public static void updateProfileTabVisibilities(
        List<String> profileNames, 
        List<Map<String, Object>> tabToUpdate
    ) {
        if (profileNames == null || profileNames.isEmpty() || 
            tabToUpdate == null || tabToUpdate.isEmpty()) {
            throw new AuraHandledException(ERROR_INVALID_INPUT);
        }

        try {
            UserAccessManager instance = new UserAccessManager();
            List<MetadataService.Profile> profilesToUpdate = 
                buildProfileUpdates(instance, profileNames, tabToUpdate);
            
            if (!profilesToUpdate.isEmpty()) {
                processBulkUpdates(instance, profilesToUpdate);
            }
        } catch (Exception e) {
            handleException('Error updating profiles', e);
        }
    }

    private static void processBulkUpdates(
        UserAccessManager instance, 
        List<MetadataService.Profile> profilesToUpdate
    ) {
        // Process in chunks to avoid governor limits
        Integer chunkSize = 10;
        for (Integer i = 0; i < profilesToUpdate.size(); i += chunkSize) {
            Integer endIndex = Math.min(i + chunkSize, profilesToUpdate.size());
            List<MetadataService.Profile> chunk = 
                profilesToUpdate.subList(i, endIndex);
            
            List<MetadataService.UpsertResult> results = 
                instance.service.upsertMetadata(chunk);
            handleUpsertResults(results);
        }
    }

    private static List<MetadataService.Profile> buildProfileUpdates(
        UserAccessManager instance, 
        List<String> profileNames, 
        List<Map<String, Object>> tabToUpdate
    ) {
        List<MetadataService.Profile> profilesToUpdate = new List<MetadataService.Profile>();
        for (String profileName : profileNames) {
            MetadataService.Profile updatedProfile = new MetadataService.Profile();
            updatedProfile.fullName = profileName;
            updatedProfile.tabVisibilities = consolidatingTabVisibilitiesToUpdate(tabToUpdate, new Map<String, MetadataService.ProfileTabVisibility>());
            profilesToUpdate.add(updatedProfile);
        }
        return profilesToUpdate;
    }

    private static List<MetadataService.ProfileTabVisibility> consolidatingTabVisibilitiesToUpdate(List< Map<String, Object> > tabsToUpdate, Map < String, MetadataService.ProfileTabVisibility > existingVisibilities){
        List< MetadataService.ProfileTabVisibility > tabVisibilitiesToUpdate = new List< MetadataService.ProfileTabVisibility >();    
        for (Map<String, Object> tab : tabsToUpdate) {
            String tabName = (String) tab.get('Name');
            String visibility = (String) tab.get('Visibility');
            MetadataService.ProfileTabVisibility tabVisibility;
            if (existingVisibilities.containsKey(tabName)) {
                tabVisibility = existingVisibilities.get(tabName);
            } else {
                tabVisibility = new MetadataService.ProfileTabVisibility();
                tabVisibility.tab = tabName;
            }
            tabVisibility.visibility = visibility;
            tabVisibilitiesToUpdate.add(tabVisibility);
        }
        return tabVisibilitiesToUpdate;
    }

    private static void handleUpsertResults(List < MetadataService.UpsertResult > results) {
        for (MetadataService.UpsertResult upsertResult: results) {
            if (!upsertResult.success) {
                handleErrorMessages(upsertResult.errors);         
            } else {
                System.debug('Tab Setting visibilities updated successfully for: ' + upsertResult.fullName);
            }
        }
    }
    // Handling result error messages
    @TestVisible
    private static void handleErrorMessages(List<MetadataService.Error> errors){
        for (MetadataService.Error error: errors) {
            if (error.fields != null) {
                System.debug('Error Fields: ' + String.join(error.fields, ', '));
            }
        }
        handleException('Exception: ' + errors[0].message, null);
    }
}