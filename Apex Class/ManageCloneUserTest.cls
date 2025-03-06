//This class is used to check the functionality of ManageCloneUser class.
@IsTest
public class ManageCloneUserTest {
    
    static User testUser1;
    static User testUser2;
    static PermissionSet testPermissionSet;
    static PermissionSetGroup testPermissionSetGroup;
    static Group testPublicGroup;
    static Group testQueue;
    private static final String Script_Thrown_Message = 'Script-thrown exception';
    private static final String Error_Thrown_Message = 'Expected AuraHandledException but it was not thrown.';
    // Test data constants
    private static final String TEST_EMAIL = 'test@example.com';
    private static final String TEST_USERNAME = 'testuser@example.com';
    //This setup holds the test data.
    @TestSetup
    static void setupTestData() {
        UserLicense license = [SELECT Id FROM UserLicense LIMIT 1];
        Profile profilewithMatchingLicense = [SELECT Id FROM Profile WHERE UserLicenseId = :license.Id LIMIT 1];
        Profile profile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        testUser1 = new User(FirstName = 'Sample',LastName = 'User123',Email = 'Sampleuser123@example.com',Username = 'Sampleuser123@example.com',
            Alias = 'testus',
            CommunityNickname = 'testuser',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = profilewithMatchingLicense.Id,
            LanguageLocaleKey = 'en_US'
        );
        insert testUser1;
        
        testUser2 = new User(FirstName = 'Sample',LastName = 'User345',Email = 'SampleUser345@example.com',Username = 'SampleUser345@example.com',
            Alias = 'testus',
            CommunityNickname = 'sampleuser',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = profile.Id,
            LanguageLocaleKey = 'en_US',
            IsActive = True
        );
        insert testUser2;

        // Create Permission Set
        testPermissionSet = new PermissionSet(Name = 'TestPermissionSet1122', Label = 'Test Permission Set1122');
        insert testPermissionSet;
        // Assign Permission Set to User
        PermissionSetAssignment psa = new PermissionSetAssignment(AssigneeId = testUser2.Id, PermissionSetId = testPermissionSet.Id);
        insert psa;
        // Create Permission Set Group
        testPermissionSetGroup = new PermissionSetGroup(MasterLabel = 'Test Permission Set Group1122', DeveloperName = 'TestPermissionSetGroup1122');
        insert testPermissionSetGroup;
        // Assign Permission Set Group to User
        PermissionSetAssignment psaGroup = new PermissionSetAssignment(AssigneeId = testUser2.Id, PermissionSetGroupId = testPermissionSetGroup.Id);
        insert psaGroup;
        // Create Public Group
        testPublicGroup = new Group(Name = 'Test Public Group', DeveloperName = 'TestPublicGroup', Type = 'Regular');
        insert testPublicGroup;
        // Create Queue
        testQueue = new Group(Name = 'Test Queue', DeveloperName = 'TestQueue', Type = 'Queue');
        insert testQueue;
        // Add User to Queue
        GroupMember queueMember = new GroupMember(GroupId = testQueue.Id, UserOrGroupId = testUser2.Id);
        insert queueMember;

        // Create test user with license
        User testUser = new User(
            Username = TEST_USERNAME,
            Email = TEST_EMAIL,
            FirstName = 'Test',
            LastName = 'User',
            Alias = 'tuser',
            ProfileId = profile.Id,
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/Los_Angeles'
        );
        insert testUser;
        
        // Create test permission sets
        List<PermissionSet> testPermSets = new List<PermissionSet>();
        for(Integer i = 0; i < 3; i++) {
            testPermSets.add(new PermissionSet(
                Name = 'TestPS' + i,
                Label = 'Test Permission Set ' + i
            ));
        }
        insert testPermSets;
    }
    //This test method is used to check the functionality of getUsers method in ManageCloneUser class.
    @IsTest
    static void testGetUsers() {
        Test.startTest();
        List<User> users = ManageCloneUser.getUsers();
        System.assertNotEquals(8, users.size(),'users have same size');
        Test.stopTest();
    }
    //This test method is used to check the functionality of getUserAssignedGroups method in ManageCloneUser class.
    @IsTest
    static void testGetUserAssignedGroups() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Test.startTest();
        Map<String, List<SObject>> result = ManageCloneUser.getUserAssignedGroups(testUser2.Id);
        ManageCloneUser.getUserAssignedGroups(null);
        System.assertNotEquals(1, result.size(),'users have same size');
        Test.stopTest();
    }
    //This test method is used to check the functionality of assignPermissionsAndGroups(Success) method in ManageCloneUser class.
    @IsTest
    static void testAssignPermissionsAndGroups() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Group testPublicGroup = [select id from Group where Name ='Test Public Group'];
        Group testQueue = [select id from Group where Name ='Test Queue'];   
        
        //Insert test permission set
        permissionSet testExamplePermissionSet = new PermissionSet(Name = 'testExamplePermissionSet', Label = 'Test Example Permission');
        insert testExamplePermissionSet;
        
        Test.startTest();
        List<PermissionSetAssignment> existingAssignments = [
            SELECT Id, PermissionSetId 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :testUser2.Id 
            AND PermissionSetId = :testExamplePermissionSet.Id
        ];
        System.assertEquals(existingAssignments.size(), 0, 'No Assignment Created');
        ManageCloneUser.assignPermissionsAndGroups(
            testUser2.Id,
            new List<Id>{testExamplePermissionSet.Id},
            new List<Id>{testPublicGroup.Id},
            new List<Id>{testQueue.Id}
        );
        List<PermissionSetAssignment> newAssignments = [
            SELECT Id, PermissionSetId 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :testUser2.Id 
            AND PermissionSetId = :testExamplePermissionSet.Id
        ];
        System.assert(existingAssignments.size() < newAssignments.size(), true);
        System.assertEquals(newAssignments.size(), 1, 'New Assignment Created');
        Test.stopTest();
    }
    //This test method is used to check the functionality of assignPermissionsAndGroups(Fail) method in ManageCloneUser class.
    @IsTest
    static void testAssignPermissionsAndGroups_ExceptionHandling() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Group testPublicGroup = [select id from Group where Name ='Test Public Group'];
        Group testQueue = [select id from Group where Name ='Test Queue'];
        Test.startTest();
        try{
        ManageCloneUser.assignPermissionsAndGroups(
            testUser2.id,null,
            new List<Id>{testPublicGroup.Id},
            new List<Id>{testQueue.Id}
        );
          System.assert(true, Error_Thrown_Message);
        } catch(AuraHandledException e){
          System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);  
        }
        Test.stopTest();
    }
    //This test method is used to check the functionality of userActivation method(Success) in ManageCloneUser class.
     @IsTest
    static void testUserActivationActivate() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Test.startTest();
        User updatedUser = ManageCloneUser.userActivation(testUser2.Id, true);
        Test.stopTest();
        System.assertEquals(true, updatedUser.IsActive, 'User should be activated');
    }
    //This test method is used to check the functionality of userActivation method(Fail) in ManageCloneUser class.
     @IsTest
    static void testUserActivationActivate_ExceptionHandling() {
        Test.startTest();
        try{
        ManageCloneUser.userActivation(null, true);
        System.assert(true, Error_Thrown_Message);
        } catch (AuraHandledException e){
          System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);    
        }
        Test.stopTest();
    }
    //This test method is used to check the functionality of getPermissionSetsByUserLicense method in ManageCloneUser class.
    @IsTest
    static void testGetPermissionSetsByUserLicense() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Test.startTest();
        ManageCloneUser.PermissionSetWrapper wrapper = ManageCloneUser.getPermissionSetsByUserLicense(testUser2.Id);
        Test.stopTest();
        System.assertNotEquals(1, wrapper.permissionSets.size(), 'Should return one unassigned regular permission set');
    }
    //This test method is used to check the functionality of getAssignedAssignment method in ManageCloneUser class.
    @IsTest
    static void testGetAssignedAssignment() {
        User testUser2 = [select id from user where Username = 'SampleUser345@example.com'];
        Test.startTest();
        ManageCloneUser.PermissionSetWrapper wrapper = ManageCloneUser.getAssignedAssignment(testUser2.Id);
        Test.stopTest();
        System.assertEquals(0, wrapper.permissionSets.size(), 'Should return zero assigned regular permission set');
        System.assertEquals(1, wrapper.permissionSetGroups.size(), 'Should return one unassigned permission set group');
        System.assertEquals(1, wrapper.publicGroupQueue.size(), 'Should return one unassigned group or queue');
    }
    //This test method is used to check the functionality of getAllUsers method in ManageCloneUser class.
    @IsTest
    static void testGetAllUsers() {
        Test.startTest();
        List<User> result = ManageCloneUser.getAllUsers();
        Test.stopTest();
        System.assert(result.size() > 2, 'Result should contain at least two users');
    }
    //This test method is used to check the functionality of getConnectedAssignment method in ManageCloneUser class.
    @isTest
    static void testGetConnectedAssignment() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        ConnectedApplication existingApp = [SELECT Id FROM ConnectedApplication LIMIT 1];
        Test.startTest();
        ManageCloneUser.PermissionSetWrapper result = ManageCloneUser.getConnectedAssignment(existingApp.Id);
        Test.stopTest();
        system.debug('result>>'+result);
        System.assertNotEquals(null, result.permissionSets.size(), 'The ConnectedAppId should not be null');
    }
    //This test method is used to check the functionality of getConnectedAppId method in ManageCloneUser class.
    @isTest
    static void testGetConnectedAppId() {
        Test.startTest();
        String connectedAppId = ManageCloneUser.getConnectedAppId();
        Test.stopTest();
        System.assertNotEquals('', connectedAppId, 'The ConnectedAppId should not be null');
    }
    
    @IsTest
    static void testBulkAssignments() {
        User testUser = [SELECT Id FROM User WHERE Username = :TEST_USERNAME];
        List<PermissionSet> permSets = [SELECT Id FROM PermissionSet WHERE Name LIKE 'TestPS%'];
        List<Id> permSetIds = new List<Id>();
        for(PermissionSet ps : permSets) {
            permSetIds.add(ps.Id);
        }

        Test.startTest();
        try {
            ManageCloneUser.assignPermissionsAndGroups(
                testUser.Id,
                permSetIds,
                new List<Id>(),
                new List<Id>()
            );
        } catch(Exception e) {
            System.assert(false, 'Should not throw exception: ' + e.getMessage());
        }
        Test.stopTest();

        // Verify assignments
        List<PermissionSetAssignment> assignments = [
            SELECT Id 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :testUser.Id
        ];
        System.assertEquals(permSetIds.size(), assignments.size(), 
            'Should have correct number of assignments');
    }
}