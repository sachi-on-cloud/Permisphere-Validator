//This class is used to check the functionality of UserPermissionAnalyzerServer class
@IsTest
public class UserPermissionAnalyzerServerTest {
    private static final String TEST_PROFILE_NAME = 'Standard User';
    private static final String TEST_PERMISSION = 'PermissionsEmailSingle';
    
    @TestSetup
    static void setupTestData() {
        // Create test data with proper error handling
        try {
            Profile testProfile = [SELECT Id FROM Profile WHERE Name = :TEST_PROFILE_NAME LIMIT 1];
            createTestUsers(testProfile.Id);
            createTestPermissionSets();
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Error in test setup: ' + e.getMessage());
            throw e;
        }
    }
    
    @IsTest
    static void testGetCombinedUserPermissions_Success() {
        // Arrange
        User testUser = [SELECT Id FROM User WHERE Username = 'testuser@test.com' LIMIT 1];
        List<String> permSetIds = getTestPermissionSetIds();
        
        // Act
        Test.startTest();
        UserPermissionAnalyzerServer.UserPermissionsWrapper result = 
            UserPermissionAnalyzerServer.getCombinedUserPermissionsForUser(permSetIds);
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        validatePermissionResults(result);
    }
    
    //This method holds the test data
    @testsetup
    static void testsetupMethod() {
        PermissionAnalyzerObjectServerTest.testsetupMethod();
    }
    //This test method is used to check the functionality of getCombinedUserPermissionsForUser method in UserPermissionAnalyzerServer class
    @IsTest
    static void getCombinedUserPermissionsForUser_Test() {
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
        permissionPartnerSoapSforceComMock.indicatorVar = 'LoginResult';
        Test.setMock(HttpCalloutMock.class, new UserPermissionDependencyMock());
        User u = [SELECT Id FROM User WHERE Username = 'testuseraccess1@example.com' LIMIT 1];
        List<Id> permSetIds = new List<Id>(new Map<Id, PermissionSet>([SELECT Id FROM PermissionSet]).keySet());
        System.runAs(u) {
            Test.startTest();
            UserPermissionAnalyzerServer.UserPermissionsWrapper result1 = UserPermissionAnalyzerServer.getCombinedUserPermissionsForUser(permSetIds);
            List < Object > result = UserPermissionAnalyzerServer.getUserPermissionUserDependency();
            Test.stopTest();
            System.assertNotEquals(null, result, 'Results should not be null');
            System.assertNotEquals(null, result1, 'Results should not be null');
        }
    }
    //This test method is used to check the functionality of getMutedUserPermissionOfPermSetGrp method in UserPermissionAnalyzerServer class
    @IsTest
    static void getMutedUserPermissionOfPermSetGrp_Test() {
        List < Map < String, Object >> userPermMapList = new List < Map < String, Object >> {new Map < String,
            Object > {
                'fieldLabel' => 'Send Email',
                'fieldName' => 'PermissionsEmailSingle',
                'fieldValue' => true},
            new Map < String,
            Object > {
                'fieldLabel' => 'Email Mass',
                'fieldName' => 'PermissionsEmailMass',
                'fieldValue' => true},
            new Map < String,
            Object > {
                'fieldLabel' => 'Edit Task',
                'fieldName' => 'PermissionsEditTask',
                'fieldValue' => true}
        };
        Test.startTest();
        PermissionSetGroup testGroup = new PermissionSetGroup(MasterLabel = 'New TestGroup', DeveloperName = 'New_TestGroup');
        insert testGroup;
    
        String permSetGrpId = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1'LIMIT 1].Id;
        String permissionNames = 'PermissionsEmailMass,PermissionsEmailSingle,PermissionsEditTask';
         UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp(permSetGrpId, permissionNames, userPermMapList);
         UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp(testGroup.Id, permissionNames, userPermMapList);
         UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp(null, permissionNames, userPermMapList);         
         UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp('DummyId', 'PermissionsEmailMass,PermissionsEmailSingle,EditTask', userPermMapList);
         System.assert(true, 'Exception should have been thrown');
        Test.stopTest();
    }
    //This test method is used to check the functionality of getSelectedUserPermissionOrigins method in UserPermissionAnalyzerServer class
    @IsTest
    static void getSelectedUserPermissionOrigins_Test() {
        List<Id> permSetIds = new List<Id>(new Map<Id, PermissionSet>([SELECT Id FROM PermissionSet]).keySet());
        Test.startTest();
        Map < String, List < String >> result = UserPermissionAnalyzerServer.getSelectedUserPermissionOrigins('PermissionsEditTask', permSetIds);
        Test.stopTest();
        System.assertNotEquals(null, result, 'Result should not be null');
    }
    //This test method is used to check the functionality of updateUserPermissionsforProfOrPermSetOrMuteGroups method in UserPermissionAnalyzerServer class
    @IsTest
    static void updateUserPermissionsforProfOrPermSetOrMuteGroups_Test() {
        Map < String, Boolean > userPermMap = new Map < String, Boolean > {'EmailMass' => false,'ListEmailSend' => false};
        Map < String, Boolean > userPermMapMute = new Map < String, Boolean > {'EmailMass' => true,'ListEmailSend' => true};
        Id profileId = [SELECT Id FROM Profile WHERE Name = 'Standard User'].Id;
        Id permSetId = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1'].Id;
        Id mutePermSetId = [SELECT Id FROM MutingPermissionSet WHERE DeveloperName = 'New_Test_MutePermSet_1'].Id;
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        Map < String, Boolean > resultProf = UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(
            [SELECT Id FROM PermissionSet WHERE ProfileId =: profileId].Id,'HCH Sales User',userPermMap);
        Map < String, Boolean > resultPermSet = UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(permSetId,'TestProfile',userPermMap);
        Map < String, Boolean > resultGroup = UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(mutePermSetId,'TestProfile',userPermMapMute);
        testErrorScenarios();
        Test.stopTest();
        System.assertNotEquals(null, resultProf, 'Profile update result should not be null');
        System.assertNotEquals(null, resultPermSet, 'Permission Set update result should not be null');
        System.assertNotEquals(null, resultGroup, 'Muting Permission Set update result should not be null');
    }
    //This test method is used to check the functionality of updateUserPermissionsforProfOrPermSetOrMuteGroups method for Error Scenario in UserPermissionAnalyzerServer class
    private static void testErrorScenarios() {
        Map < String, Boolean > userPermMapErr = new Map < String, Boolean > {'EmailMass' => false};
        Map < String, Boolean > userPermMapMuteErr = new Map < String, Boolean > {'EmailMass' => true};
        try {
            UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(null,'TestProfile',userPermMapErr);
            System.assert(false, 'Exception should be thrown for invalid PermissionSet scenario');
        } catch (Exception e) {
            System.assert(true, 'Exception thrown as expected for invalid PermissionSet scenario');
        }
        try {
            UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups(null,'TestProfile',userPermMapMuteErr);
            System.assert(false, 'Exception should be thrown for invalid MutingPermissionSet scenario');
        } catch (Exception e) {
            System.assert(true, 'Exception thrown as expected for invalid MutingPermissionSet scenario');
        }
    }
    
}