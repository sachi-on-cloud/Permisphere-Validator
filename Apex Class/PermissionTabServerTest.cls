//This class is used to check the functionality of PermissionTabServer class
@IsTest
private class PermissionTabServerTest {
    private static final String OPPORTUNITY_Amount_FIELD = 'Opportunity.Amount';
    private static final String Result_Not_Null_Message = 'Result should not be null';
    private static final String TEST_OBJECT = 'Account';
    private static final String TEST_FIELD = 'Name';
    private static final String TEST_PERMISSION = 'PermissionsRead';
    //This method holds the test data
    @TestSetup
    static void setupTestData() {
        PermissionAnalyzerObjectServerTest.testsetupMethod();
        // Create test profile
        Profile testProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        
        // Create test users
        List<User> testUsers = new List<User>();
        for(Integer i = 0; i < 3; i++) {
            testUsers.add(createTestUser(testProfile.Id, i));
        }
        insert testUsers;
        
        // Create test permission sets
        List<PermissionSet> testPermSets = createTestPermissionSets();
        insert testPermSets;
        
        // Create test assignments
        List<PermissionSetAssignment> assignments = createTestAssignments(testUsers, testPermSets);
        insert assignments;
    }
    //This test method is used to check the functionality of getUserDefinitions method
    @IsTest
    static void testGetUserDefinitions() {
        // Act
        Test.startTest();
        Map<String, String> result = PermissionTabServer.getUserDefinitions();
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(!result.isEmpty(), 'Should return permissions');
    }
    //This test method is used to check the functionality of getObjectDefinition method
    @IsTest
    static void testGetObjectDefinition() {
        List < EntityDefinition > result = PermissionTabServer.getObjectDefinition();
        System.assertNotEquals(null, result, 'Object definitions should not be null');
        System.assert(!result.isEmpty(), 'Object definitions should not be empty');
    }
    //This test method is used to check the functionality of getFieldDefinition method
    @IsTest
    static void testGetFieldDefinition() {
        // Act
        Test.startTest();
        List<Map<String, Object>> result = PermissionTabServer.getFieldDefinition(TEST_OBJECT);
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(!result.isEmpty(), 'Should return fields');
    }
    @IsTest
    static void testGetFieldDefinition_InvalidInput() {
        // Act & Assert
        Test.startTest();
        try {
            PermissionTabServer.getFieldDefinition('');
            System.assert(false, 'Should throw exception');
        } catch(AuraHandledException e) {
            System.assert(true, 'Exception thrown as expected');
        }
        Test.stopTest();
    }
    //This test method is used to check the functionality of getPermsandUsersOfSelectedPerms method
    @IsTest
    static void testGetPermsandUsersOfSelectedPerms() {
        String permSetId = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1'].Id;
        
        PermissionTabServer.profilePermissionsetandUserWrapper[] results = new PermissionTabServer.profilePermissionsetandUserWrapper[] {
            PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {
                'PermissionsApiEnabled'
                    }, '', '', '', '', '', 'All'),
                PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {'PermissionsApiEnabled'}, '', '', '', '', '', permSetId),
                PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {}, 'Opportunity', 'PermissionsRead', '', '', '', 'All'),
                PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {}, 'Opportunity', 'PermissionsRead', '', '', '', permSetId),
                PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {}, '', '', 'Opportunity', 'Eligible__c', 'PermissionsRead', 'All'),
                PermissionTabServer.getPermsandUsersOfSelectedPerms(new List < String > {}, '', '', 'Opportunity', 'Eligible__c', 'PermissionsRead', permSetId)
                };
                    
                    for (PermissionTabServer.profilePermissionsetandUserWrapper result: results) {
                        System.assertNotEquals(null, result, 'Result should not be null for valid permission set');
                    }
    }
    //This test method is used to check the functionality of getObjOrFieldPerm method
    @IsTest
    static void testGetObjOrFieldPerm() {
        Id userId = [SELECT Id FROM User WHERE UserName = 'testuseraccess1@example.com'].Id;
        
        List < Map < String, List < String >>> results = new List < Map < String, List < String >>> {
            PermissionTabServer.getObjOrFieldPerm('Opportunity', 'PermissionsRead', null, userId),
                PermissionTabServer.getObjOrFieldPerm('Opportunity', 'PermissionsRead', OPPORTUNITY_Amount_FIELD, userId),
                PermissionTabServer.getObjOrFieldPerm('Opportunity', 'PermissionsRead', OPPORTUNITY_Amount_FIELD, 'DummyID')
                };
                    
                    for (Map < String, List < String >> result: results) {
                        System.assertNotEquals(null, result, Result_Not_Null_Message);
                    }
    }
    //This test method is used to check the functionality of getUserPerm method
    @IsTest
    static void testGetUserPerm() {
        Id userId = [SELECT Id FROM User WHERE UserName = 'testuseraccess1@example.com'].Id;
        
        List < Map < String, List < String >>> results = new List < Map < String, List < String >>> {
            PermissionTabServer.getUserPerm(userId, new List < String > {
                'PermissionsApiEnabled'
                    }),
                
                PermissionTabServer.getUserPerm('DummyID', new List < String > {
                    'PermissionsAPIEnabled'
                        })
                };
                    
                    for (Map < String, List < String >> result: results) {
                        System.assertNotEquals(null, result, Result_Not_Null_Message);
                    }
    }
    //This test method is used to check the functionality of getObjOrFieldPermissionsOrigin method
    @IsTest
    static void testGetObjOrFieldPermissionsOrigin() {
        List < String > permSetIdList = new List < String > ();
        for (PermissionSet perm: [SELECT Id FROM PermissionSet]) {
            permSetIdList.add(perm.Id);
        }
        
        List < Map < String, List < String >>> results = new List < Map < String, List < String >>> {
            PermissionTabServer.getObjOrFieldPermissionsOrigin('PermissionsRead', permSetIdList, 'Opportunity', null),
                PermissionTabServer.getObjOrFieldPermissionsOrigin('PermissionsRead', permSetIdList, 'Opportunity', OPPORTUNITY_Amount_FIELD)
                };
                    
                    for (Map < String, List < String >> result: results) {
                        System.assertNotEquals(null, result, Result_Not_Null_Message);
                        System.assert(!result.isEmpty(), 'Result should not be empty');
                    }
    }
    // Helper methods
    private static User createTestUser(Id profileId, Integer index) {
        return new User(
            FirstName = 'Test' + index,
            LastName = 'User' + index,
            Email = 'testuser' + index + '@test.com',
            Username = 'testuser' + index + '@test.com',
            Alias = 'tuser' + index,
            ProfileId = profileId,
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/Los_Angeles'
        );
    }
}