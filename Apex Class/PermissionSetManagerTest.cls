//This test class is used to check functionality of PermissionSetManager class.
@IsTest
private class PermissionSetManagerTest {
    // Constants
    private static final String TEST_USER_EMAIL = 'testuser@example.com';
    private static final String TEST_PERMISSION_SET = 'Test_Permission_Set';
    private static final String TEST_LABEL = 'Test Permission Set';
    private static final String TEST_DESCRIPTION = 'Test Description';
    
    @TestSetup
    static void setupTestData() {
        // Create test data in bulk
        Profile testProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        
        // Create multiple test users
        List<User> testUsers = new List<User>();
        for(Integer i = 0; i < 3; i++) {
            testUsers.add(createTestUser(testProfile.Id, i));
        }
        insert testUsers;
        
        // Create multiple permission sets
        List<PermissionSet> testPermSets = createTestPermissionSets();
        insert testPermSets;
        
        // Create test object permissions in bulk
        List<ObjectPermissions> objPermissions = createTestObjectPermissions(testPermSets[0].Id);
        insert objPermissions;
    }
    
    @IsTest
    static void testCreatePermissionSet_Bulk() {
        // Arrange
        List<User> testUsers = [SELECT Id FROM User WHERE Email LIKE 'testuser%@example.com'];
        List<Id> userIds = new List<Id>();
        for(User u : testUsers) {
            userIds.add(u.Id);
        }
        
        Map<String, Object> permSetToCreate = new Map<String, Object>{
            'Name' => TEST_PERMISSION_SET,
            'Label' => TEST_LABEL,
            'Description' => TEST_DESCRIPTION,
            'License' => null,
            'hasActivationRequired' => false
        };
        
        // Act
        Test.startTest();
        String permissionSetId = PermissionSetManager.createPermissionSet(permSetToCreate, userIds);
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, permissionSetId, 'Permission Set ID should not be null');
        List<PermissionSetAssignment> assignments = [
            SELECT Id 
            FROM PermissionSetAssignment 
            WHERE PermissionSetId = :permissionSetId
        ];
        System.assertEquals(userIds.size(), assignments.size(), 'All users should be assigned');
    }
    
    @IsTest
    static void testUpdateSystemPermissions_Validation() {
        // Arrange
        PermissionSet testPermSet = [
            SELECT Id, Name 
            FROM PermissionSet 
            WHERE Name = 'New_Test_Permission_Set_1' 
            LIMIT 1
        ];
        String invalidJson = 'invalid json';
        
        // Act & Assert
        Test.startTest();
        try {
            PermissionSetManager.updateSystemPermissions(invalidJson, testPermSet.Id);
            System.assert(false, 'Should throw exception for invalid JSON');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Invalid JSON format'));
        }
        Test.stopTest();
    }

    // Helper methods
    private static List<ObjectPermissions> createTestObjectPermissions(Id permSetId) {
        return new List<ObjectPermissions>{
            new ObjectPermissions(
                ParentId = permSetId,
                SObjectType = 'Account',
                PermissionsRead = true,
                PermissionsCreate = true,
                PermissionsEdit = true,
                PermissionsDelete = false,
                PermissionsViewAllRecords = false,
                PermissionsModifyAllRecords = false
            ),
            new ObjectPermissions(
                ParentId = permSetId,
                SObjectType = 'Contact',
                PermissionsRead = true,
                PermissionsCreate = true,
                PermissionsEdit = true,
                PermissionsDelete = false,
                PermissionsViewAllRecords = false,
                PermissionsModifyAllRecords = false
            )
        };
    }
}