//This class is used for creating connected app.
//Used in setupComponent LWC.
public with sharing class ConnectedAppCreation {
    //This method is for creating connected app.
    @AuraEnabled(cacheable=true)
    public static String createApp(String connectedId) {
        List<ConnectedApplication> connectedApps = [SELECT Id, Name FROM ConnectedApplication WHERE Id = : connectedId LIMIT 1];
        try {
            if(connectedApps.isEmpty()){
                UserAccessBatch batchJob = new UserAccessBatch();
                Database.executeBatch(batchJob, 200);
                return 'Connected App creation is in progress. Please wait... ';
            }
            else{
                CreateConnectedAppQueueable.createAndPublishPlatformEvent('Error','App already exist',null);
                return 'Error: App Exist';
            }
        } catch (Exception e) {
            return 'Error: ' + e.getMessage();
        }
    }
    //This method is for retrieving newly created connected app.
    @AuraEnabled(cacheable=true)
    public static Boolean getUserAccessConnectedApp(String connectedId) {
         if (connectedId == null) {
        return false;
    }
    List<ConnectedApplication> connectedApps = [SELECT Id, Name FROM ConnectedApplication WHERE Id = :connectedId LIMIT 1];
    return !connectedApps.isEmpty();
    }
    //This method is for assigning permission sets & profiles to connected app.
    @AuraEnabled
    public static void assignAssignmentsConnectedApp(String connectedAppId, List<String> permissionSetIds)
    {
        List<PermissionSet> existingAssignments = [SELECT Id, Name, ProfileId, Profile.Name, IsOwnedByProfile FROM PermissionSet WHERE Id IN (SELECT ParentId FROM SetupEntityAccess WHERE SetupEntityId = :connectedAppId)];
        
        Map<String, PermissionSet> existingAssignmentsMap = new Map<String, PermissionSet>();
        for (PermissionSet ps : existingAssignments) {
            existingAssignmentsMap.put(ps.Id, ps);
        }
        
        List<SetupEntityAccess> setupEntityAccessList = new List<SetupEntityAccess>();
        List<SetupEntityAccess> recordsToDelete = new List<SetupEntityAccess>();
        
        for (String permissionSetId : permissionSetIds) {
            if (existingAssignmentsMap.containsKey(permissionSetId)) {
                recordsToDelete.add(new SetupEntityAccess(
                    Id = [SELECT Id 
                          FROM SetupEntityAccess 
                          WHERE ParentId = :permissionSetId 
                          AND SetupEntityId = :connectedAppId LIMIT 1].Id
                ));
            } else {
                SetupEntityAccess psAccess = new SetupEntityAccess();
                psAccess.ParentId = permissionSetId;
                psAccess.SetupEntityId = connectedAppId;
                setupEntityAccessList.add(psAccess);
            }
        }
        try {
            if (!setupEntityAccessList.isEmpty()) {
                insert setupEntityAccessList;
            }
            
            if (!recordsToDelete.isEmpty()) {
                delete recordsToDelete;
            }
        } catch (Exception e) {
            System.debug('Error processing permission sets: ' + e.getMessage());
    		throw new AuraHandledException(e.getMessage());
        }
        
    }
    
    
}