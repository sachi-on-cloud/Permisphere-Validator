//This class is used to check the functionality of PermissionSetGroupManager class
@IsTest
public class PermissionSetGroupManagerTest {
    private static final String Script_Thrown_Message = 'Script-thrown exception';
    private static final String Error_Thrown_Message = 'Expected AuraHandledException but it was not thrown.';
    private static final String PERMISSION_SET_DESCRIPTION = 'Updated Description';
    private static final String PERMISSION_SET_LABEL = 'New Test Permission Set Group Four';
    private static final String MASTER_LABEL_ASSERT_MSG = 'The MasterLabel was not updated correctly';
    private static final String PERMISSION_SET_GROUP_DESCRIPTION = 'New Permission Set Group Description';
    private static final String PROFILE_NAME = 'HCH Sales';
    private static final String RESULT_NOT_NULL_MSG = 'The result should not be null.';
    
    // Test constants
    private static final String TEST_LABEL = 'Test Permission Set Group';
    private static final String TEST_API_NAME = 'Test_Permission_Set_Group';
    private static final String TEST_DESCRIPTION = 'Test Description';
    
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
    }
    
    //This test method is used to check the functionality of getPermissionSetGrp method in PermissionSetGroupManager class
    @IsTest
    static void testGetPermissionSetGrp() {
        // Arrange
        setupTestPermissionSetGroup();
        
        // Act
        Test.startTest();
        List<PermissionSetGroupManager.permissionSetGroupWrapper> result = 
            PermissionSetGroupManager.getPermissionSetGrp();
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertTrue(result.size() > 0, 'Should return at least one group');
    }
    
    //This test method is used to check the functionality of createPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testCreatePermissionSetGroupSuccess() {
        PermissionSet perSet = [Select id from PermissionSet where Name='New_Test_Permission_Set_2' Limit 1];      
        List<String> permissionSetIds = new List<String>{ perSet.id};
        Test.startTest();
        PermissionSetGroupManager.createPermissionSetGroup('New Test Permission Set Group 4', 'New_Test_Permission_Set_Group_4', 'Test Description', permissionSetIds, true);
        Test.stopTest();
        PermissionSetGroup createdGroup = [SELECT Id, MasterLabel, DeveloperName, Description, HasActivationRequired FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1'];
        System.assertEquals('New Test Permission Set Group 1', createdGroup.MasterLabel, 'Group label mismatch');
        System.assertEquals('New_Test_PermSetGrp_1', createdGroup.DeveloperName, 'Group API name mismatch');
    }
    
    //This test method is used to check the functionality of createPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testCreatePermissionSetGroup_DmlException() {
        Test.startTest();
        try {
            PermissionSetGroupManager.createPermissionSetGroup('New Test Permission Set Group Two', 'New_Test_Permission_Set_Group_Two', 'Test Description', null, true);
            System.assert(false, Error_Thrown_Message);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of editPermissionSetGrp method(success status) in PermissionSetGroupManager class
    @IsTest
    static void testEditPermissionSetGroupSuccessGroup() {
        PermissionSetGroup perSetGrp = [Select id from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' limit 1];
        Test.startTest();
        PermissionSetGroup updatedGroup = PermissionSetGroupManager.editPermissionSetGrp(perSetGrp.Id, PERMISSION_SET_LABEL, 'New_Test_Permission_Set_Group_Four', PERMISSION_SET_DESCRIPTION, 'group');
        Test.stopTest();
        System.assertEquals(PERMISSION_SET_LABEL, updatedGroup.MasterLabel, MASTER_LABEL_ASSERT_MSG);
        System.assertEquals('New_Test_Permission_Set_Group_Four', updatedGroup.DeveloperName, 'The DeveloperName was not updated correctly');
        System.assertEquals(PERMISSION_SET_DESCRIPTION, updatedGroup.Description, 'The Description was not updated correctly');    
    }
    
    //This test method is used to check the functionality of editPermissionSetGrp method(error status) in PermissionSetGroupManager class
    @IsTest
    static void testEditPermissionSetGroupSuccessSet() {
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_1' limit 1];
        Test.startTest();
        try{
            PermissionSetGroup updatedGroup = PermissionSetGroupManager.editPermissionSetGrp(perSet.Id, PERMISSION_SET_LABEL, 'New_Test_Permission_Set_Group_Four', PERMISSION_SET_DESCRIPTION, 'permission set');
            System.assert(false, Error_Thrown_Message);
            System.assertEquals(PERMISSION_SET_LABEL, updatedGroup.MasterLabel, MASTER_LABEL_ASSERT_MSG);
            System.assertEquals('New_Test_Permission_Set_Group_Four', updatedGroup.DeveloperName, 'The DeveloperName was not updated correctly');
            System.assertEquals(PERMISSION_SET_DESCRIPTION, updatedGroup.Description, 'The Description was not updated correctly');
        }catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of editPermissionSetGrp method(error status) in PermissionSetGroupManager class
    @IsTest
    static void testEditPermissionSetGroupErrorSet() {
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_3' limit 1];
        Test.startTest();
        try {
            PermissionSetGroup updatedGroup = PermissionSetGroupManager.editPermissionSetGrp(perSet.Id, PERMISSION_SET_LABEL, 'New_Test_Permission_Set_Group_Four', PERMISSION_SET_DESCRIPTION, 'permission set');
            System.assert(false,Error_Thrown_Message);
            System.assertEquals(PERMISSION_SET_LABEL, updatedGroup.MasterLabel, MASTER_LABEL_ASSERT_MSG);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of editPermissionSetGrp method(No format status) in PermissionSetGroupManager class
    @IsTest
    static void testEditPermissionSetGroupNoFormat() {
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_2' limit 1];
        Test.startTest();
        try {
            PermissionSetGroup updatedGroup = PermissionSetGroupManager.editPermissionSetGrp(perSet.Id, 'New Test Permission Set Group One', 'New_Test_Permission_Set_Group_One', PERMISSION_SET_DESCRIPTION, '');
            System.assert(false, Error_Thrown_Message);
            System.assertEquals('New Test Permission Set Group One', updatedGroup.MasterLabel, MASTER_LABEL_ASSERT_MSG);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of clonePermissionSetGroup(success status) method in PermissionSetGroupManager class
    @IsTest
    static void testClonePermissionSetGroup() {
        PermissionSetGroup perSetGrp = [Select id,DeveloperName,MasterLabel from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_1' Limit 1];
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_1' limit 1];
        PermissionSetGroupComponent psgComponent = new PermissionSetGroupComponent(PermissionSetGroupId = perSetGrp.Id,PermissionSetId = perSet.Id);
        insert psgComponent;
        Test.startTest();
        try{
            PermissionSetGroupManager.clonePermissionSetGroup(perSetGrp.MasterLabel,'NewPermissionSetGroup','NewPermissionSetGroup',PERMISSION_SET_GROUP_DESCRIPTION); 
            System.assert(true, Error_Thrown_Message);
        }catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
        PermissionSetGroup newPsg = [SELECT Id, MasterLabel, DeveloperName, Description FROM PermissionSetGroup WHERE MasterLabel = 'NewPermissionSetGroup' LIMIT 1];
        System.assertNotEquals(null, newPsg, 'New Permission Set Group should be created');
        System.assertEquals('NewPermissionSetGroup', newPsg.DeveloperName, 'DeveloperName should match the provided API name');
        System.assertEquals(PERMISSION_SET_GROUP_DESCRIPTION, newPsg.Description, 'Description should match the provided description');
        List<PermissionSetGroupComponent> newComponents = [SELECT PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :newPsg.Id];
        System.assertEquals(2, newComponents.size(), 'There should be two Permission Set Group Components in the new Permission Set Group');
        
    }
    
    //This test method is used to check the functionality of clonePermissionSetGroup method(error status) in PermissionSetGroupManager class
    @IsTest
    static void testClonePermissionSetGroupDMLException() {
        PermissionSetGroup perSetGrp = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        
        Test.startTest();
        try {
            PermissionSetGroupManager.clonePermissionSetGroup(perSetGrp.DeveloperName,'NewPermissionSetGroup','NewPermissionSetGroup',PERMISSION_SET_GROUP_DESCRIPTION); 
            System.assert(false, Error_Thrown_Message);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of deletePermissionSetGroupWithUnassignments method in PermissionSetGroupManager class
    @IsTest
    static void testDeletePermissionSetGroupWithUnassignments() {
        PermissionSetGroup perSetGrp = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_2' limit 1];
        PermissionSetGroupComponent psgComponent = new PermissionSetGroupComponent(PermissionSetGroupId = perSetGrp.Id,PermissionSetId = perSet.Id);
        insert psgComponent;    
        Test.startTest();
        PermissionSetGroupManager.deletePermissionSetGroupWithUnassignments(perSetGrp.Id);   
        Test.stopTest();
        List<PermissionSetAssignment> remainingAssignments = [SELECT Id FROM PermissionSetAssignment WHERE PermissionSetGroupId = :perSetGrp.Id];
        System.assertEquals(0, remainingAssignments.size(), 'All Permission Set Assignments should be deleted.');
        List<PermissionSetGroupComponent> remainingComponents = [SELECT Id FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :perSetGrp.Id];
        System.assertEquals(0, remainingComponents.size(), 'All Permission Set Group Components should be deleted.');
        List<PermissionSetGroup> remainingGroups = [SELECT Id FROM PermissionSetGroup WHERE Id = :perSetGrp.Id];
        System.assertEquals(0, remainingGroups.size(), 'The Permission Set Group should be deleted.');
    }
    
    //This test method is used to check the functionality of getUserPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testGetUserPermissionSetGroup_Filters() {
        PermissionSetGroup perSetGrp = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        Test.startTest();
        List<User> userList = PermissionSetGroupManager.getUserPermissionSetGroup(PROFILE_NAME, null, perSetGrp.Id);   
        Test.stopTest();
        System.assertEquals(0, userList.size(), 'There should be 0 user returned with the profile filter.');
    }
    
    //This test method is used to check the functionality of getUserPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testGetUserPermissionSetGroup_AllFilters() {
        // Get Permission Set Group
        PermissionSetGroup perSetGrp = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        Test.startTest();
        List<User> userList = PermissionSetGroupManager.getUserPermissionSetGroup(PROFILE_NAME, 'All', perSetGrp.Id);     
        Test.stopTest();
        System.assertEquals(0, userList.size(), 'There should be 0 user returned with the profile filter.');
    }
    
    //This test method is used to check the functionality of getUserPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testGetPermissionGroup_Success() {
        List<User> testUsers = [SELECT Id FROM User where Email = 'testuser2@example.com' LIMIT 1];
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        List<String> userIds = new List<String>();
        for (User u : testUsers) {
            userIds.add(u.Id);
        }
        try {
            PermissionSetGroupManager.getPermissionGroup(userIds, testPermissionSetGroup.Id);
            System.assert(false, 'A DmlException should have been thrown');
        }catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        List<PermissionSetAssignment> assignments = [SELECT Id, AssigneeId, PermissionSetGroupId FROM PermissionSetAssignment WHERE PermissionSetGroupId = :testPermissionSetGroup.Id];
        System.assertEquals(0, assignments.size(), 'No users should have been assigned to the Permission Set Group');
    }
    
    //This test method is used to check the functionality of getUserPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testGetPermissionGroup_DmlException() {
        List<User> testUsers = [SELECT Id FROM User where Email = 'testuser1@example.com' LIMIT 1];
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        PermissionSetGroup testPerSetGrp = new PermissionSetGroup(MasterLabel='New Test PermSetGrp 4',DeveloperName='New_Test_PermSetGrp_4');
        insert testPerSetGrp;
        List<String> userIds = new List<String>();
        for (User u : testUsers) {
            userIds.add(u.Id);
        }
        PermissionSetAssignment existingAssignment = new PermissionSetAssignment(AssigneeId = testUsers[0].Id,PermissionSetGroupId = testPerSetGrp.Id);
        insert existingAssignment;
        Test.startTest();
        try {
            PermissionSetGroupManager.getPermissionGroup(userIds, testPermissionSetGroup.Id);
            System.assert(false, 'A DmlException should have been thrown');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    
    //This test method is used to check the functionality of getUserPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testGetPermissionSetGroup() {
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_1' Limit 1];
        Test.startTest();
        List<User> assignedUsers = PermissionSetGroupManager.getPermissionSetGroup(testPermissionSetGroup.Id);
        Test.stopTest();
        System.assertEquals(0, assignedUsers.size(), 'There should be 0 users assigned to the Permission Set Group');
    }
    
    //This test method is used to check the functionality of deletePermissionGroup method in PermissionSetGroupManager class
    @IsTest
    static void testDeletePermissionGroup_Success() {
        List<User> testUsers = [SELECT Id FROM User where Email = 'testuser1@example.com' LIMIT 1];
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_1' Limit 1];
        List<String> userIds = new List<String>();
        for (User u : testUsers) {
            userIds.add(u.Id);
        }
        Test.startTest();
        PermissionSetGroupManager.deletePermissionGroup(userIds, testPermissionSetGroup.Id);
        Test.stopTest();
        List<PermissionSetAssignment> remainingAssignments = [SELECT Id FROM PermissionSetAssignment WHERE PermissionSetGroupId = :testPermissionSetGroup.Id];
        System.assertEquals(0, remainingAssignments.size(), 'All user assignments should have been deleted');
    }
    
    //This test method is used to check the functionality of getProfiles method in PermissionSetGroupManager class
    @IsTest
    static void testGetProfiles() {
        Test.startTest();
        List<Profile> profiles = PermissionSetGroupManager.getProfiles();
        Test.stopTest();
        System.assertNotEquals(0, profiles.size(), 'The profile list should not be empty');
    }
    
    //This test method is used to check the functionality of getPermissionSet method in PermissionSetGroupManager class
    @IsTest
    static void testGetPermissionSet_WithoutSearchTerm() {
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1]; 
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_1' limit 1];        
        PermissionSetGroupComponent psgComponent = new PermissionSetGroupComponent(PermissionSetGroupId = testPermissionSetGroup.Id,PermissionSetId = perSet.Id);
        insert psgComponent;
        Test.startTest();
        List<PermissionSet> permissionSets = PermissionSetGroupManager.getPermissionSet(testPermissionSetGroup.Id, 'New PermSet');
        Test.stopTest();
        System.assertEquals(0, permissionSets.size(), 'Permission sets should be returned');
        for (PermissionSet ps : permissionSets) {
            System.assertEquals(null, ps.Id, 'Permission Set Id should not be null');
        }
    }
    
    //This test method is used to check the functionality of testPermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testInsertPermissionSet() {
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_1' Limit 1];
        List<PermissionSet> testPermissionSets = [SELECT Id FROM PermissionSet where Name = 'New_Test_Permission_Set_3' LIMIT 1];
        List<String> permissionSetIds = new List<String>();
        for (PermissionSet ps : testPermissionSets) {
            permissionSetIds.add(ps.Id);
        }
        Test.startTest();
        PermissionSetGroupManager.insertPermissionSet(permissionSetIds, testPermissionSetGroup.Id);
        Test.stopTest();
        List<PermissionSetGroupComponent> insertedComponents = [SELECT Id, PermissionSetId, PermissionSetGroupId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :testPermissionSetGroup.Id];
        System.assertEquals(3, insertedComponents.size(), 'Three Permission Set Group Components should be inserted');
        Set<Id> insertedPermissionSetIds = new Set<Id>();
        for (PermissionSetGroupComponent component : insertedComponents) {
            insertedPermissionSetIds.add(component.PermissionSetId);
        }
        for (String permissionSetId : permissionSetIds) {
            System.assert(insertedPermissionSetIds.contains(permissionSetId), 'Permission Set ID should be part of the inserted components');
        }
    }
    
    //This test method is used to check the functionality of deletePermissionSet method in PermissionSetGroupManager class
    @IsTest
    static void testDeletePermissionSet() {
        PermissionSetGroup testPermissionSetGroup = [Select id,DeveloperName from PermissionSetGroup where DeveloperName = 'New_Test_PermSetGrp_2' Limit 1];
        List<PermissionSet> testPermissionSets = [SELECT Id FROM PermissionSet where Name = 'New_Test_Permission_Set_3' LIMIT 1];
        List<String> permissionSetIds = new List<String>();
        for (PermissionSet ps : testPermissionSets) {
            permissionSetIds.add(ps.Id);
        }
        Test.startTest();
        PermissionSetGroupManager.deletePermissionSet(permissionSetIds, testPermissionSetGroup.Id);
        Test.stopTest();
        List<PermissionSetGroupComponent> remainingComponents = [SELECT Id, PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :testPermissionSetGroup.Id];
        System.assertEquals(1, remainingComponents.size(), 'Permission Set Group Component should remain after deletion');
    }
    
    //This test method is used to check the functionality of getSetPermission method in PermissionSetGroupManager class
    @IsTest
    static void testGetSetPermission() {
        Test.startTest();
        List<Map<String, String>> permissionSetData = PermissionSetGroupManager.getSetPermission();
        Test.stopTest();
        System.assertNotEquals(0, permissionSetData.size(), 'The result list should not be empty.');
        for (Map<String, String> permissionSetMap : permissionSetData) {
            System.assertNotEquals(null, permissionSetMap.get('Id'), 'Permission Set Id should not be null.');
            System.assertNotEquals(null, permissionSetMap.get('Name'), 'Permission Set Name should not be null.');
            System.assertNotEquals(null, permissionSetMap.get('Label'), 'Permission Set Label should not be null.');
        }
    }
    
    //This test method is used to check the functionality of getProfileDetails method in PermissionSetGroupManager class
    @IsTest
    static void testGetProfileDetails() {
        Test.startTest();
        List<PermissionSet> permissionSets = PermissionSetGroupManager.getProfileDetails();
        Test.stopTest();
        System.assertNotEquals(0, permissionSets.size(), 'The result list should not be empty.');
        for (PermissionSet ps : permissionSets) {
            System.assertNotEquals(null, ps.ProfileId, 'ProfileId should not be null.');
            System.assertNotEquals(null, ps.Profile.Name, 'Profile Name should not be null.');
        }
    }
    
    //This test method is used to check the functionality of getUnAssignedUserForPermissionSet method in PermissionSetGroupManager class
    @IsTest
    static void testGetUnAssignedUserForPermissionSet() {
        PermissionSet perSet = [Select id from PermissionSet where Name='New_Test_Permission_Set_2' Limit 1];
        Test.startTest();
        List<User> unassignedUsers = PermissionSetGroupManager.getUnAssignedUserForPermissionSet(perSet.id, PROFILE_NAME, 'Salesforce', 'Salesforce');
        Test.stopTest();
        System.assertEquals(0, unassignedUsers.size(), 'There should be no unassigned user.');
    }
    
    //This test method is used to check the functionality of checkDuplicatePermissionSetGroup method in PermissionSetGroupManager class
    @IsTest
    static void testCheckDuplicatePermissionSetGroup_LabelExists() {
        Test.startTest();
        Boolean isDuplicate = PermissionSetGroupManager.checkDuplicatePermissionSetGroup('New Test Permission Set Three', 'New_Test_Permission_Set_Threre');
        Test.stopTest();
        System.assertEquals(false, isDuplicate, 'The method should return false for an existing label.');
    }
    
    //This test method is used to check the functionality of getAssignedPermissionSet method in PermissionSetGroupManager class
    @IsTest
    static void testGetAssignedPermissionSet() {
        PermissionSetGroup testPermissionSetGroup = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_2' LIMIT 1];
        PermissionSet perSet = [Select id,PermissionSetGroupId from PermissionSet where Name = 'New_Test_Permission_Set_2' limit 1];    
        PermissionSetGroupComponent psgComponent = new PermissionSetGroupComponent(PermissionSetGroupId = testPermissionSetGroup.Id,PermissionSetId = perSet.Id);
        insert psgComponent;
        Test.startTest();
        List<PermissionSet> assignedPermissionSets = PermissionSetGroupManager.getAssignedPermissionSet(testPermissionSetGroup.Id);
        Test.stopTest();
        System.assertEquals(2, assignedPermissionSets.size(), 'There should be two assigned permission set.');
        System.assertEquals('New_Test_Permission_Set_2', assignedPermissionSets[0].Name, 'The assigned permission set name should match.');
    }
    
    //This test method is used to check the functionality of getMutedObjandFieldPermissions method in PermissionSetGroupManager class
    @IsTest
    static void testGetMutedObjandFieldPermissions_ExistingGroup() {
        PermissionSetGroup permSetGroup = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1' LIMIT 1];
        PermissionSetGroup permSetGroupNoComponent = new PermissionSetGroup(DeveloperName = 'New_Test_PermSetGrp_4', MasterLabel = 'Test PermSet Group No Component');
        insert permSetGroupNoComponent;
        List<String> objNames = new List<String>{'Account', 'Contact'};
        String objName = 'Opportunity';
        Test.startTest();
        PermissionSetGroupManager.MutePermissionWrapper result = PermissionSetGroupManager.getMutedObjandFieldPermissions(permSetGroup.Id, objNames, objName);
        PermissionSetGroupManager.getMutedObjandFieldPermissions(permSetGroupNoComponent.Id, objNames, objName);
        Test.stopTest();
        System.assertNotEquals(null, result.mutePermSetId);
        System.assertNotEquals(null, result.wrapper);
        System.assert(result.wrapper.objectPermissions.isEmpty(), 'Object permissions should be empty.');
    }
    
    //This test method is used to check the functionality of getMutedObjandFieldPermissions method in PermissionSetGroupManager class
    @IsTest
    static void testObjAndFieldPermHelper() {
        PermissionSet permSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_2' LIMIT 1];
        List<String> objNames = new List<String>{'Opportunity','Contact'};
        String objName = 'Opportunity';
        Test.startTest();
         PermissionSetGroupManager.SObjectPermissionWrapper result = PermissionSetGroupManager.objAndFieldPermHelper(permSet.Id, objNames, objName);
        Test.stopTest();
        System.assertNotEquals(null, result.objectPermissions, 'ObjectPermissions map should not be null');
    }
    
    //This test method is used to check the functionality of getSobject method in PermissionSetGroupManager class
    @IsTest
    static void testGetSobjectWithValidPermId() {
        PermissionSetGroup testGroup = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_2' LIMIT 1];
        Test.startTest();
        PermissionSetGroupManager.PermissionSetGroupObjectDetails result = PermissionSetGroupManager.getSobject(testGroup.Id);
        Test.stopTest();
        System.assertNotEquals(null, result, RESULT_NOT_NULL_MSG);
    }
    //This test method is used to check the functionality of getCombinedPermissions method in PermissionSetGroupManager class
    @IsTest
    static void testGetCombinedPermissions() {
        PermissionSetGroup psg = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_2' LIMIT 1];
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
        permissionPartnerSoapSforceComMock.indicatorVar =  'LoginResult'; 
        new UserAccessManager();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'ProfileName'));
        Test.startTest();
        PermissionSetGroupManager.userObjAndFieldPermissionSetGroupWrapper result = 
        PermissionSetGroupManager.getCombinedPermissions(psg.Id, 'Account', 'Test_PSG');
        Test.stopTest();
        System.assertNotEquals(null, result, RESULT_NOT_NULL_MSG);
    }
    
    //This test method is used to check the functionality of mutePermissions method in PermissionSetGroupManager class
    @IsTest
    static void testMutePermissionsWithValidPermissions() {
        Map<String, Map<String, Object>> systemPermissionsMap = new Map<String, Map<String, Object>>{'' => new Map<String, Object>{
            'PermissionsViewAllData' => true,'PermissionsModifyAllData' => false}};
                String systemPermissionsMapJson = JSON.serialize(systemPermissionsMap);
        PermissionSetGroup psg = new PermissionSetGroup(MasterLabel = 'New Test Permission Set Group 3',DeveloperName = 'New_Test_PermSetGrp_3',
                                                        Description = 'Test Permission Set Group for muting permissions');
        insert psg;
        Test.startTest();
        try {
            PermissionSetGroupManager.mutePermissions(systemPermissionsMapJson, psg.MasterLabel, psg.DeveloperName, psg.Id);
            System.assert(false, Error_Thrown_Message);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);
        }
        Test.stopTest();
    }
    //This test method is used to check the functionality of updateMutePermissions method in PermissionSetGroupManager class
    @IsTest
    static void testUpdateMutePermissions() {
        MutingPermissionSet mutePerm =[Select id from MutingPermissionSet where DeveloperName='New_Test_MutePermSet_1' Limit 1];
        PermissionSet permSet =[Select id from PermissionSet where Name='New_Test_Permission_Set_1' Limit 1];
        Map<String, Map<String, Boolean>> objPermission = new Map<String, Map<String, Boolean>> {
            'Opportunity' => new Map<String, Boolean> {
                'PermissionsRead' => false,
                    'PermissionsCreate' => true,
                    'PermissionsEdit' => false,
                    'PermissionsDelete' => false,
                    'PermissionsViewAllRecords' => false,
                    'PermissionsModifyAllRecords' => false
                    }
        };
        List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPermissionWrapperList = new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>();
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper fieldPermission1 = new PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper();
        fieldPermission1.Field = 'Opportunity.Amount';
        fieldPermission1.label = 'Amount';
        fieldPermission1.hasEditAccess = true;
        fieldPermission1.PermissionsRead = true;
        fieldPermission1.PermissionsEdit = false;
        fieldPermission1.mutedPermissionsRead = true;
        fieldPermission1.mutedPermissionsEdit = true;
        fieldPermissionWrapperList.add(fieldPermission1);
        Test.startTest();
        PermissionSetGroupManager.MutePermissionUpdateWrapper result = PermissionSetGroupManager.updateMutePermissions(mutePerm.id,permSet.id,
                                                                                                                       'Opportunity',objPermission,fieldPermissionWrapperList);
        Test.stopTest();
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertNotEquals(null, result.objectPermissions, 'Object permissions should not be null');
        System.assertNotEquals(null, result.fieldPermissions, 'Field permissions should not be null');
    }
    
    @IsTest
    static void testInsertPermissionSetWithException() {
        PermissionSet permSet =[Select id from PermissionSet where Name='New_Test_Permission_Set_1' Limit 1];
        PermissionSetGroup testGroup = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_2' LIMIT 1];
        
        List<String> invalidPermissionSetIds = new List<String>{ permSet.id };
        String invalidPermissionSetGroupId = testGroup.id;
        Test.startTest();
        PermissionSetGroupManager.insertPermissionSet(invalidPermissionSetIds, invalidPermissionSetGroupId);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetSobjectPermissionsForPermissionSetGroup() {
        // Retrieve test data
        PermissionSetGroup psg = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1' LIMIT 1];
        String objName = 'Account';
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
        permissionPartnerSoapSforceComMock.indicatorVar = 'LoginResult';
        Test.setMock(HttpCalloutMock.class, new PermissionDependencyMock());
        
        Test.startTest();
        PermissionSetGroupManager.PermissionSetGroupObjectPermissionsWrapper result = PermissionSetGroupManager.getSobjectPermissionsForPermissionSetGroup(psg.Id, objName);
        Test.stopTest();
        System.assert(result.fieldPermissions.size() > 0, 'Field Permissions should not be empty');
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

    private static List<PermissionSet> createTestPermissionSets() {
        List<PermissionSet> testPermSets = new List<PermissionSet>();
        for(Integer i = 0; i < 3; i++) {
            testPermSets.add(new PermissionSet(
                Name = 'New_Test_Permission_Set_' + i,
                IsOwnedByProfile = false
            ));
        }
        return testPermSets;
    }

    private static void setupTestPermissionSetGroup() {
        // Implementation of setupTestPermissionSetGroup method
    }
}