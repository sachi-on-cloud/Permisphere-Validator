//This class is used to create,clone,activating,deactivating,assigning permission sets,permission set groups,public groups,queues for user.
public with sharing class ManageCloneUser {
    // Cache for license limits to avoid repeated queries
    private static Map<String, Integer> licenseLimitCache;
    
    //This method is used to get users based on available licenses left.
    @AuraEnabled(cacheable=true)
    public static List<User> getUsers() {
        // Bulkify license query and processing
        Map<String, Integer> availableLicenseLimits = getLicenseLimits();
        Set<String> validLicenseNames = new Set<String>();
        
        for (String licenseName : availableLicenseLimits.keySet()) {
            if (availableLicenseLimits.get(licenseName) > 0) {
                validLicenseNames.add(licenseName);
            }
        }
        
        return validLicenseNames.isEmpty() ? new List<User>() :
            [SELECT Id, Name, Profile.Name, Profile.UserLicense.Name, UserRole.Name 
             FROM User 
             WHERE IsActive = true 
             AND Profile.UserLicense.Name IN :validLicenseNames 
             ORDER BY Name];
    }
    
    //This method is used to retrieve users assigned with permissionset,ps group,public group & queues.
    @AuraEnabled(cacheable=true)
    public static Map<String, List<SObject>> getUserAssignedGroups(String userId) {
        Map<String, List<SObject>> result = new Map<String, List<SObject>>();
        
        if (userId == null) {
            return result;
        }
        Set<Id> permissionSetIds = new Set<Id>();
        for (PermissionSetAssignment psa : [SELECT PermissionSetId, PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = :userId]) {
            permissionSetIds.add(psa.PermissionSetId);
        }
        result.put('permissionSets', [SELECT Id, Name FROM PermissionSet WHERE Type ='Regular' AND Id IN :permissionSetIds]);
        List<PermissionSetGroup> permissionSetGroups = [SELECT Id, MasterLabel FROM PermissionSetGroup WHERE Id IN (
            SELECT PermissionSetGroupId FROM PermissionSetAssignment WHERE AssigneeId = :userId)
                                                       ];
        result.put('permissionSetGroups', permissionSetGroups);
        
        List<Group> publicGroups = [SELECT Id, Name FROM Group WHERE Type = 'Regular' AND Id IN (
            SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :userId)
                                   ];
        result.put('publicGroups', publicGroups);
        
        List<Group> queues = [SELECT Id, Name FROM Group WHERE Type = 'Queue' AND Id IN (
            SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :userId)
                             ];
        result.put('queues', queues);
        return result;
    }
    //This method is for assigning permission sets,permissionset group,public group,queue for user.
    @AuraEnabled
    public static void assignPermissionsAndGroups(Id userId, List<Id> permissionSetIds, 
                                                 List<Id> publicGroupIds, List<Id> queueIds) {
        try {
            // Validate inputs
            validateInputs(userId, permissionSetIds, publicGroupIds, queueIds);
            
            // Process in transaction
            Savepoint sp = Database.setSavepoint();
            try {
                if (permissionSetIds != null && !permissionSetIds.isEmpty()) {
                    assignPermissionSets(userId, permissionSetIds);
                }
                if (publicGroupIds != null && !publicGroupIds.isEmpty()) {
                    assignPublicGroups(userId, publicGroupIds);
                }
                if (queueIds != null && !queueIds.isEmpty()) {
                    assignQueues(userId, queueIds);
                }
            } catch (Exception e) {
                Database.rollback(sp);
                throw new AuraHandledException('Assignment failed: ' + e.getMessage());
            }
        } catch (Exception ex) {
            throw new AuraHandledException('Error: ' + ex.getMessage());
        }
    }
    
    //This method is for assigning permission sets
    @AuraEnabled
    public static void assignPermissionSets(Id userId, List<Id> permissionSetIds) {
        // Query existing assignments once
        Map<Id, PermissionSetAssignment> existingAssignments = new Map<Id, PermissionSetAssignment>();
        for (PermissionSetAssignment psa : [SELECT Id, PermissionSetId 
                                          FROM PermissionSetAssignment 
                                          WHERE AssigneeId = :userId 
                                          AND PermissionSetId IN :permissionSetIds]) {
            existingAssignments.put(psa.PermissionSetId, psa);
        }

        List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();
        List<PermissionSetAssignment> toDelete = new List<PermissionSetAssignment>();

        for (Id psId : permissionSetIds) {
            if (!existingAssignments.containsKey(psId)) {
                toInsert.add(new PermissionSetAssignment(
                    AssigneeId = userId,
                    PermissionSetId = psId
                ));
            }
        }

        // Bulk DML operations
        if (!toDelete.isEmpty()) {
            delete toDelete;
        }
        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
    }
    //This method is for assigning public groups
    @AuraEnabled
    public static void assignPublicGroups(Id userId,List<Id> publicGroupIds)
    {
        if (!publicGroupIds.isEmpty()) {
            List<GroupMember> existingPublicGroups = [SELECT Id, GroupId FROM GroupMember WHERE UserOrGroupId = :userId AND GroupId IN :publicGroupIds];
            
            List<GroupMember> groupsToRemove = new List<GroupMember>();
            List<GroupMember> groupsToAdd = new List<GroupMember>();
            
            Set<Id> existingPublicGroupIds = new Set<Id>();
            for (GroupMember gm : existingPublicGroups) {
                existingPublicGroupIds.add(gm.GroupId);
                groupsToRemove.add(gm);
            }
            
            for (Id groupId : publicGroupIds) {
                if (!existingPublicGroupIds.contains(groupId)) {
                    groupsToAdd.add(new GroupMember(UserOrGroupId = userId, GroupId = groupId));
                }
            }
            
            if (!groupsToRemove.isEmpty()) {
                delete groupsToRemove;
            }
            
            if (!groupsToAdd.isEmpty()) {
                insert groupsToAdd;
            }
        }
    }
    //This method is for assigning queues
    @AuraEnabled
    public static void assignQueues(Id userId,List<Id> queueIds)
    {
        if (!queueIds.isEmpty()) {
            List<GroupMember> existingQueues = [SELECT Id, GroupId FROM GroupMember WHERE UserOrGroupId = :userId AND GroupId IN :queueIds];
            
            List<GroupMember> queuesToRemove = new List<GroupMember>();
            List<GroupMember> queuesToAdd = new List<GroupMember>();
            
            Set<Id> existingQueueIds = new Set<Id>();
            for (GroupMember gm : existingQueues) {
                existingQueueIds.add(gm.GroupId);
                queuesToRemove.add(gm);
            }
            
            for (Id queueId : queueIds) {
                if (!existingQueueIds.contains(queueId)) {
                    queuesToAdd.add(new GroupMember(UserOrGroupId = userId, GroupId = queueId));
                }
            }
            
            if (!queuesToRemove.isEmpty()) {
                delete queuesToRemove;
            }
            
            if (!queuesToAdd.isEmpty()) {
                insert queuesToAdd;
            }
        }
    }
    //This method is used to fetch list of users.
    @AuraEnabled(cacheable=true)
    public static List<User> getAllUsers() {
        return [SELECT Id, Name, ProfileId, Email,profile.UserLicense.Name,IsActive FROM User order By Name asc];
    }
    //This method is used for user activation.
    @AuraEnabled
    public static User userActivation(Id userId, Boolean isActive) {
        try {
            User userRecord = [SELECT Id, Name, ProfileId, Email, profile.UserLicense.Name, IsActive FROM User WHERE Id = :userId LIMIT 1];
            userRecord.IsActive = isActive;
            update userRecord;
            return userRecord;
        } catch (Exception ex) {
            throw new AuraHandledException('An error occurred while updating the user activation: ' + ex.getMessage());
        }
    }
    
    public class PermissionSetWrapper {
        @AuraEnabled public List<PermissionSet> profiles { get; set; }
        @AuraEnabled public List<PermissionSet> permissionSets { get; set; }
        @AuraEnabled public List<PermissionSet> permissionSetGroups { get; set; }
        @AuraEnabled public List<Group> publicGroupQueue { get; set; }
        @AuraEnabled public List<PermissionSet> assignedProfile { get; set; }
        @AuraEnabled public List<PermissionSet> assignedPermissionSet { get; set; }
        
        public PermissionSetWrapper() {
            profiles = new List<PermissionSet>();
            permissionSets = new List<PermissionSet>();
            permissionSetGroups = new List<PermissionSet>();
            publicGroupQueue = new List<Group>();
            assignedProfile = new List<PermissionSet>();
            assignedPermissionSet = new List<PermissionSet>();
        }
    }
    //This method is used to retrieve userlicense based permission sets,permission set groups,public groups,queues.
    @AuraEnabled(cacheable=true)
    public static PermissionSetWrapper getPermissionSetsByUserLicense(Id userId) {
        User user = [SELECT Profile.UserLicenseId FROM User WHERE Id = :userId LIMIT 1];
        Id userLicenseId = user.Profile.UserLicenseId;
        if (userLicenseId == null) {
            throw new AuraHandledException('User does not have a valid license.');
        }
        
        PermissionSetWrapper wrapper = new PermissionSetWrapper();
        
        Set<Id> assignedPermissionSetIds = new Set<Id>();
        for (PermissionSetAssignment psa : [
            SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = :userId
        ]) {
            assignedPermissionSetIds.add(psa.PermissionSetId);
        }
        
        wrapper.permissionSets = [SELECT Id, Name,Label, LicenseId, License.Name FROM PermissionSet WHERE LicenseId = :userLicenseId 
                                  AND Type = 'Regular' AND Id NOT IN :assignedPermissionSetIds ORDER BY Name ASC];
        
        wrapper.permissionSetGroups = [SELECT Id, Name, LicenseId, License.Name FROM PermissionSet WHERE  Type = 'Group'
                                       AND Id NOT IN :assignedPermissionSetIds ORDER BY Name ASC];
        
        Set<Id> assignedGroupIds = new Set<Id>();
        for (GroupMember gm : [SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :userId]) 
        {
            assignedGroupIds.add(gm.GroupId);
        }
        
        wrapper.publicGroupQueue = [SELECT Id, Name, DeveloperName, Type FROM Group WHERE Type IN ('Regular', 'Queue')AND Id NOT IN :assignedGroupIds ORDER BY Name ASC];
        return wrapper;
    }
    //This method used to retrieve the assigned permission sets,permission set groups,public groups,queues of the user.
    @AuraEnabled(cacheable=true)
    public static PermissionSetWrapper getAssignedAssignment(Id userId) {
        User user = [SELECT Profile.UserLicenseId FROM User WHERE Id = :userId LIMIT 1];
        Id userLicenseId = user.Profile.UserLicenseId;
        if (userLicenseId == null) {
            throw new AuraHandledException('User does not have a valid license.');
        }
        
        PermissionSetWrapper wrapper = new PermissionSetWrapper();
        
        wrapper.permissionSets = [SELECT Id, Name, LicenseId, License.Name FROM PermissionSet WHERE LicenseId = :userLicenseId 
                                  AND Type = 'Regular' AND Id IN (SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = :userId) ORDER BY Name ASC];
        
        wrapper.permissionSetGroups = [SELECT Id, Name, LicenseId, License.Name FROM PermissionSet 
                                       WHERE Type = 'Group' AND Id IN (SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = :userId) ORDER BY Name ASC];
        
        wrapper.publicGroupQueue = [SELECT Id, Name, DeveloperName, Type FROM Group WHERE Type IN ('Regular', 'Queue')
                                    AND Id IN (SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :userId) ORDER BY Name ASC];
        return wrapper;
    }
    //This method retrieves the profiles and permission sets associated with a connected app.
    @AuraEnabled(cacheable=true)
    public static PermissionSetWrapper getConnectedAssignment(String connectedAppId) {
        PermissionSetWrapper wrapper = new PermissionSetWrapper();
        wrapper.profiles = [SELECT Id,Name, ProfileId, Profile.Name, IsOwnedByProfile from PermissionSet where Id NOT IN (SELECT ParentId FROM SetupEntityAccess WHERE SetupEntityId =: connectedAppId)  AND Type = 'Profile' ORDER BY Profile.Name];
        wrapper.permissionSets = [SELECT Id,Name, ProfileId, Profile.Name, IsOwnedByProfile from PermissionSet where Id NOT IN (SELECT ParentId FROM SetupEntityAccess WHERE SetupEntityId =: connectedAppId)  AND Type = 'Regular' ORDER BY Name];
        
        wrapper.assignedProfile = [SELECT Id,Name, ProfileId, Profile.Name, IsOwnedByProfile FROM PermissionSet WHERE Id IN (SELECT ParentId FROM SetupEntityAccess WHERE SetupEntityId = :connectedAppId) AND Type = 'Profile' ORDER BY Profile.Name];
        wrapper.assignedPermissionSet = [SELECT Id,Name, ProfileId, Profile.Name, IsOwnedByProfile FROM PermissionSet WHERE Id IN (SELECT ParentId FROM SetupEntityAccess WHERE SetupEntityId = :connectedAppId) AND Type = 'Regular' ORDER BY Name];
        return wrapper;
    }
    //This method retrieves the ID of the connected app
    @AuraEnabled
    public static String getConnectedAppId() {
        try {
            List<ConnectedApplication> connectedApps = [SELECT Id, Name FROM ConnectedApplication WHERE Name = 'User Access Connected App' LIMIT 1];
            if (!connectedApps.isEmpty()) {
                return connectedApps[0].Id;
            } else {
                return null;
            }
        } catch (Exception e) {
            System.debug('Error occurred: ' + e.getMessage());
            return null;
        }
    }

    // Improved error handling and caching
    private static Map<String, Integer> getLicenseLimits() {
        if (licenseLimitCache != null) {
            return licenseLimitCache;
        }

        licenseLimitCache = new Map<String, Integer>();
        for (UserLicense ul : [SELECT Name, MasterLabel, TotalLicenses, UsedLicenses 
                              FROM UserLicense]) {
            licenseLimitCache.put(ul.MasterLabel, ul.TotalLicenses - ul.UsedLicenses);
        }
        return licenseLimitCache;
    }

    // Input validation
    private static void validateInputs(Id userId, List<Id> permissionSetIds, 
                                     List<Id> publicGroupIds, List<Id> queueIds) {
        if (userId == null) {
            throw new IllegalArgumentException('User ID cannot be null');
        }
    }
}