@isTest
public class PermissionPartnerSoapSforceComMock implements WebServiceMock  {
    public static string indicatorVar;
    public void doInvoke(
        object stud,
        object request,
        map<string, object> response,
        string endpoint,
        string soapAction,
        string requestName,
        string responseNS,
        string responseName,
        string responseType
    ){
        if(indicatorVar == 'LoginResult' && request instanceof PermissionPartnerSoapSforceCom.login_element)
        {
            // Create a successful login response
            PermissionPartnerSoapSforceCom.loginResponse_element loginResponse = 
                new PermissionPartnerSoapSforceCom.loginResponse_element();
            
            // Create the login result
            PermissionPartnerSoapSforceCom.LoginResult loginResult = 
                new PermissionPartnerSoapSforceCom.LoginResult();
            
            // Set the required fields
            loginResult.sessionId = 'dummy-session-id-' + System.currentTimeMillis();
            loginResult.serverUrl = System.Url.getOrgDomainUrl().toExternalForm()+'/services/Soap/u/60.0';
            loginResult.metadataServerUrl = System.Url.getOrgDomainUrl().toExternalForm()+'/services/Soap/u/60.0';
            loginResult.passwordExpired = false;
            loginResult.userId = UserInfo.getUserId();
            
            // Set the result in the response
            loginResponse.result = loginResult;
            
            // Put the response in the output map
            response.put('response_x', loginResponse);
            
        }

        switch on indicatorVar{
            when 'DescribeTab' 
            {
                PermissionPartnerSoapSforceCom.describeAllTabsResponse_element response_x  = new PermissionPartnerSoapSforceCom.describeAllTabsResponse_element();
                
                List<PermissionPartnerSoapSforceCom.DescribeTab> testDescribeTab = new list<PermissionPartnerSoapSforceCom.DescribeTab>();
                PermissionPartnerSoapSforceCom.DescribeTab descTabRecord = new PermissionPartnerSoapSforceCom.DescribeTab();
                descTabRecord.colors = new List<PermissionPartnerSoapSforceCom.DescribeColor>();
                descTabRecord.icons = new List<PermissionPartnerSoapSforceCom.DescribeIcon>();
                testDescribeTab.add(descTabRecord);
                
                response_x.result = testDescribeTab;
                response.put('response_x', response_x);
            }
            when 'GroupStructureRes' 
            {
                PermissionPartnerSoapSforceCom.describeDataCategoryGroupStructuresResponse_element response_x = new PermissionPartnerSoapSforceCom.describeDataCategoryGroupStructuresResponse_element();
                List<PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupStructureResult> testGroupStructureRes = new List<PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupStructureResult>();
                PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupStructureResult testGroupStructureRec = new PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupStructureResult();
                testGroupStructureRec.description = 'Test description';
                testGroupStructureRec.label = 'Test label';
                testGroupStructureRes.add(testGroupStructureRec);
                response_x.result= testGroupStructureRes;
                response.put('response_x', response_x);
            }
            when 'GroupResponse' 
            {
                PermissionPartnerSoapSforceCom.describeDataCategoryGroupsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeDataCategoryGroupsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupResult> testCategoryGroupResult = new list<PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupResult>();
                PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupResult testCategoryGroupRec = new PermissionPartnerSoapSforceCom.DescribeDataCategoryGroupResult();
                testCategoryGroupRec.description = 'Test description';
                testCategoryGroupRec.label = 'Test label';
                testCategoryGroupResult.add(testCategoryGroupRec);
                response_x.result = testCategoryGroupResult;
                response.put('response_x', response_x);
            }
            when 'FindDuplicates' 
            {
                PermissionPartnerSoapSforceCom.findDuplicatesResponse_element response_x = new PermissionPartnerSoapSforceCom.findDuplicatesResponse_element();
                list<PermissionPartnerSoapSforceCom.FindDuplicatesResult> testFindDuplicates = new list<PermissionPartnerSoapSforceCom.FindDuplicatesResult>();
                PermissionPartnerSoapSforceCom.FindDuplicatesResult testFindDuplicatesRec = new PermissionPartnerSoapSforceCom.FindDuplicatesResult();
                testFindDuplicatesRec.success = true;
                testFindDuplicatesRec.duplicateResults = new List<PermissionPartnerSoapSforceCom.DuplicateResult>();
                response_x.result = testFindDuplicates;
                response.put('response_x', response_x);
            }
            when 'Process' 
            {
                PermissionPartnerSoapSforceCom.processResponse_element response_x = new PermissionPartnerSoapSforceCom.processResponse_element();
                list<PermissionPartnerSoapSforceCom.ProcessResult> testProcessResult = new list<PermissionPartnerSoapSforceCom.ProcessResult>();
                PermissionPartnerSoapSforceCom.ProcessResult testProcessRec = new PermissionPartnerSoapSforceCom.ProcessResult();
                testProcessRec.instanceStatus = 'Test pass';
                testProcessRec.entityId = 'q64w66e';
                testProcessRec.instanceId = '286373';
                testProcessResult.add(testProcessRec);
                response_x.result = testProcessResult;
                response.put('response_x', response_x);
            }
            when 'DescribeGlobal' 
            {
                PermissionPartnerSoapSforceCom.describeGlobalResponse_element response_x = new PermissionPartnerSoapSforceCom.describeGlobalResponse_element();
                PermissionPartnerSoapSforceCom.DescribeGlobalResult  testDescribeGlobal = new PermissionPartnerSoapSforceCom.DescribeGlobalResult();
                testDescribeGlobal.encoding = '67q36r26h';
                testDescribeGlobal.maxBatchSize = 12;
                response_x.result = testDescribeGlobal;
                response.put('response_x', response_x);
            }
            when 'UserInfo'
            {
                PermissionPartnerSoapSforceCom.getUserInfoResponse_element response_x = new PermissionPartnerSoapSforceCom.getUserInfoResponse_element();
                PermissionPartnerSoapSforceCom.GetUserInfoResult  testUserInfo = new PermissionPartnerSoapSforceCom.GetUserInfoResult();
                testUserInfo.accessibilityMode = true;
                testUserInfo.chatterExternal = true;
                testUserInfo.currencySymbol = '$';
                response_x.result = testUserInfo;
                response.put('response_x', response_x);
            }
            when 'GlobalTheme'
            {
                PermissionPartnerSoapSforceCom.describeGlobalThemeResponse_element response_x = new PermissionPartnerSoapSforceCom.describeGlobalThemeResponse_element();
                PermissionPartnerSoapSforceCom.DescribeGlobalTheme  testGlobalTheme = new PermissionPartnerSoapSforceCom.DescribeGlobalTheme();
                response_x.result = testGlobalTheme;
                response.put('response_x', response_x);
            }
            when 'ApprovalLayout'
            {
                PermissionPartnerSoapSforceCom.describeApprovalLayoutResponse_element response_x = new PermissionPartnerSoapSforceCom.describeApprovalLayoutResponse_element();
                PermissionPartnerSoapSforceCom.DescribeApprovalLayoutResult  testApprovalLayout = new PermissionPartnerSoapSforceCom.DescribeApprovalLayoutResult();
                testApprovalLayout.approvalLayouts = new List<PermissionPartnerSoapSforceCom.DescribeApprovalLayout>();
                response_x.result = testApprovalLayout;
                response.put('response_x', response_x);
            }
            when 'CompactLayout'
            {
                PermissionPartnerSoapSforceCom.describePrimaryCompactLayoutsResponse_element response_x = new PermissionPartnerSoapSforceCom.describePrimaryCompactLayoutsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeCompactLayout> testCompactLayout = new list<PermissionPartnerSoapSforceCom.DescribeCompactLayout>();
                response_x.result = testCompactLayout;
                response.put('response_x', response_x);
            }
            when 'QueryResult'
            {
                PermissionPartnerSoapSforceCom.queryMoreResponse_element response_x = new PermissionPartnerSoapSforceCom.queryMoreResponse_element();
                PermissionPartnerSoapSforceCom.QueryResult  testQueryResult = new PermissionPartnerSoapSforceCom.QueryResult();
                testQueryResult.done = true;
                testQueryResult.queryLocator = 'Test';
                response_x.result = testQueryResult;
                response.put('response_x', response_x);
            }
            when 'EntityResult'
            {
                PermissionPartnerSoapSforceCom.describeSearchableEntitiesResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSearchableEntitiesResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeSearchableEntityResult> testEntityResult = new list<PermissionPartnerSoapSforceCom.DescribeSearchableEntityResult>();
                response_x.result = testEntityResult;
                response.put('response_x', response_x);
            }
            when 'LayoutResult'
            {
                PermissionPartnerSoapSforceCom.describeLayoutResponse_element response_x = new PermissionPartnerSoapSforceCom.describeLayoutResponse_element();
                PermissionPartnerSoapSforceCom.DescribeLayoutResult  testLayoutResult = new PermissionPartnerSoapSforceCom.DescribeLayoutResult();
                testLayoutResult.layouts = new list<PermissionPartnerSoapSforceCom.DescribeLayout>();
                testLayoutResult.recordTypeMappings = new list<PermissionPartnerSoapSforceCom.RecordTypeMapping>();
                response_x.result = testLayoutResult;
                response.put('response_x', response_x);
            }
            when 'AppMenu'
            {
                PermissionPartnerSoapSforceCom.describeAppMenuResponse_element response_x = new PermissionPartnerSoapSforceCom.describeAppMenuResponse_element();
                PermissionPartnerSoapSforceCom.DescribeAppMenuResult  testAppMenu = new PermissionPartnerSoapSforceCom.DescribeAppMenuResult();
                testAppMenu.appMenuItems = new list<PermissionPartnerSoapSforceCom.DescribeAppMenuItem>();
                response_x.result = testAppMenu;
                response.put('response_x', response_x);
            }
            when 'LeadConvert'
            {
                PermissionPartnerSoapSforceCom.convertLeadResponse_element response_x = new PermissionPartnerSoapSforceCom.convertLeadResponse_element();
                list<PermissionPartnerSoapSforceCom.LeadConvertResult>  testLeadConvert = new list<PermissionPartnerSoapSforceCom.LeadConvertResult>();
                response_x.result = testLeadConvert;
                response.put('response_x', response_x);
            }
            when 'SobjectListView'
            {
                PermissionPartnerSoapSforceCom.describeSObjectListViewsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSObjectListViewsResponse_element();
                PermissionPartnerSoapSforceCom.DescribeSoqlListViewResult  testSobjectListView = new PermissionPartnerSoapSforceCom.DescribeSoqlListViewResult();
                response_x.result = testSobjectListView;
                response.put('response_x', response_x);
            }
            when 'DeleteResult'
            {
                PermissionPartnerSoapSforceCom.deleteResponse_element response_x = new PermissionPartnerSoapSforceCom.deleteResponse_element();
                list<PermissionPartnerSoapSforceCom.DeleteResult>  testDeleteResult = new list<PermissionPartnerSoapSforceCom.DeleteResult>();
                response_x.result = testDeleteResult;
                response.put('response_x', response_x);
            }
            when 'QueryAllResult'
            {
                PermissionPartnerSoapSforceCom.queryAllResponse_element response_x = new PermissionPartnerSoapSforceCom.queryAllResponse_element();
                PermissionPartnerSoapSforceCom.QueryResult  testQueryResult = new PermissionPartnerSoapSforceCom.QueryResult();
                response_x.result = testQueryResult;
                response.put('response_x', response_x);
            }
            when 'SaveResult'
            {
                PermissionPartnerSoapSforceCom.updateResponse_element response_x = new PermissionPartnerSoapSforceCom.updateResponse_element();
                list<PermissionPartnerSoapSforceCom.SaveResult>  testSaveResult = new list<PermissionPartnerSoapSforceCom.SaveResult>();
                response_x.result = testSaveResult;
                response.put('response_x', response_x);
            }
            when 'EmptyRecycleBinResult'
            {
                PermissionPartnerSoapSforceCom.emptyRecycleBinResponse_element response_x = new PermissionPartnerSoapSforceCom.emptyRecycleBinResponse_element();
                list<PermissionPartnerSoapSforceCom.EmptyRecycleBinResult>  testRecycleResult = new list<PermissionPartnerSoapSforceCom.EmptyRecycleBinResult>();
                response_x.result = testRecycleResult;
                response.put('response_x', response_x);
            }        
            when 'DescribeCompactLayoutsResult'
            {
                PermissionPartnerSoapSforceCom.describeCompactLayoutsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeCompactLayoutsResponse_element();
                PermissionPartnerSoapSforceCom.DescribeCompactLayoutsResult  testDescribeCompactLayoutsResult = new PermissionPartnerSoapSforceCom.DescribeCompactLayoutsResult();
                response_x.result = testDescribeCompactLayoutsResult;
                response.put('response_x', response_x);
            }
            when 'ChangeOwnPasswordResult'
            {
                PermissionPartnerSoapSforceCom.changeOwnPasswordResponse_element response_x = new PermissionPartnerSoapSforceCom.changeOwnPasswordResponse_element();
                PermissionPartnerSoapSforceCom.ChangeOwnPasswordResult  testRecycleResult = new PermissionPartnerSoapSforceCom.ChangeOwnPasswordResult();
                response_x.result = testRecycleResult;
                response.put('response_x', response_x);
            }
            when 'SoqlListViews'
            {
                PermissionPartnerSoapSforceCom.describeSoqlListViewsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSoqlListViewsResponse_element();
                PermissionPartnerSoapSforceCom.DescribeSoqlListViewResult  testSoqlListViews = new PermissionPartnerSoapSforceCom.DescribeSoqlListViewResult();
                response_x.result = testSoqlListViews;
                response.put('response_x', response_x);
            }
            when 'PathAssitantResult'
            {
                PermissionPartnerSoapSforceCom.describePathAssistantsResponse_element response_x = new PermissionPartnerSoapSforceCom.describePathAssistantsResponse_element();
                PermissionPartnerSoapSforceCom.DescribePathAssistantsResult  testPathAssitantResult = new PermissionPartnerSoapSforceCom.DescribePathAssistantsResult();
                response_x.result = testPathAssitantResult;
                response.put('response_x', response_x);
            }
            when 'AvailabeQuickAction'
            {
                PermissionPartnerSoapSforceCom.describeAvailableQuickActionsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeAvailableQuickActionsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeAvailableQuickActionResult>  testAvailabeQuickAction = new list<PermissionPartnerSoapSforceCom.DescribeAvailableQuickActionResult>();
                response_x.result = testAvailabeQuickAction;
                response.put('response_x', response_x);
            }
            when else{
                response = invokeWithIndicatorVar_1(indicatorVar, response);
            }
        }
    }
    private static Map<string, object> invokeWithIndicatorVar_1(String indicatorVar, map<string, object> response){
        switch on indicatorVar{
            when 'GetDeletedResult'
            {
                PermissionPartnerSoapSforceCom.getDeletedResponse_element response_x = new PermissionPartnerSoapSforceCom.getDeletedResponse_element();
                PermissionPartnerSoapSforceCom.GetDeletedResult  testGetDeletedResult = new PermissionPartnerSoapSforceCom.GetDeletedResult();
                response_x.result = testGetDeletedResult;
                response.put('response_x', response_x);
            }
            when 'DescribeTabSetResult'
            {
                PermissionPartnerSoapSforceCom.describeTabsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeTabsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeTabSetResult>  testDescribeTabSetResult = new list<PermissionPartnerSoapSforceCom.DescribeTabSetResult>();
                response_x.result = testDescribeTabSetResult;
                response.put('response_x', response_x);
            }
            when 'QuickActionTemplateResult'
            {
                PermissionPartnerSoapSforceCom.retrieveMassQuickActionTemplatesResponse_element response_x = new PermissionPartnerSoapSforceCom.retrieveMassQuickActionTemplatesResponse_element();
                list<PermissionPartnerSoapSforceCom.QuickActionTemplateResult>  testQuickActionTemplateResult = new list<PermissionPartnerSoapSforceCom.QuickActionTemplateResult>();
                response_x.result = testQuickActionTemplateResult;
                response.put('response_x', response_x);
            }
            when 'SearchResult'
            {
                PermissionPartnerSoapSforceCom.searchResponse_element response_x = new PermissionPartnerSoapSforceCom.searchResponse_element();
                PermissionPartnerSoapSforceCom.SearchResult  testSearchResult = new PermissionPartnerSoapSforceCom.SearchResult();
                response_x.result = testSearchResult;
                response.put('response_x', response_x);
            }
            when 'SendEmail'
            {
                PermissionPartnerSoapSforceCom.sendEmailResponse_element response_x = new PermissionPartnerSoapSforceCom.sendEmailResponse_element();
                list<PermissionPartnerSoapSforceCom.SendEmailResult>  testSendEmail = new list<PermissionPartnerSoapSforceCom.SendEmailResult>();
                response_x.result = testSendEmail;
                response.put('response_x', response_x);
            }
            when 'GetUpdatedResult'
            {
                PermissionPartnerSoapSforceCom.getUpdatedResponse_element response_x = new PermissionPartnerSoapSforceCom.getUpdatedResponse_element();
                PermissionPartnerSoapSforceCom.GetUpdatedResult  testUpdatedResult = new PermissionPartnerSoapSforceCom.GetUpdatedResult();
                response_x.result = testUpdatedResult;
                response.put('response_x', response_x);
            }
            when 'SendEmailMessage'
            {
                PermissionPartnerSoapSforceCom.sendEmailMessageResponse_element response_x = new PermissionPartnerSoapSforceCom.sendEmailMessageResponse_element();
                list<PermissionPartnerSoapSforceCom.SendEmailResult>  testSendEmailMessage = new list<PermissionPartnerSoapSforceCom.SendEmailResult>();
                response_x.result = testSendEmailMessage;
                response.put('response_x', response_x);
            }
            when 'QuickActionsForRecordType'
            {
                PermissionPartnerSoapSforceCom.describeQuickActionsForRecordTypeResponse_element response_x = new PermissionPartnerSoapSforceCom.describeQuickActionsForRecordTypeResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeQuickActionResult> testQuickActionResult = new list<PermissionPartnerSoapSforceCom.DescribeQuickActionResult>();
                response_x.result = testQuickActionResult;
                response.put('response_x',response_x);
            }
            when 'RenderEmailTemplate'
            {
                PermissionPartnerSoapSforceCom.renderEmailTemplateResponse_element response_x = new PermissionPartnerSoapSforceCom.renderEmailTemplateResponse_element();
                list<PermissionPartnerSoapSforceCom.RenderEmailTemplateResult> testRenderEmailTemplate = new list<PermissionPartnerSoapSforceCom.RenderEmailTemplateResult>();
                response_x.result = testRenderEmailTemplate;
                response.put('response_x',response_x);
            }
            when 'UpsertResult'
            {
                PermissionPartnerSoapSforceCom.upsertResponse_element response_x = new PermissionPartnerSoapSforceCom.upsertResponse_element();
                list<PermissionPartnerSoapSforceCom.UpsertResult> testUpsertResult = new list<PermissionPartnerSoapSforceCom.UpsertResult>();
                response_x.result = testUpsertResult;
                response.put('response_x',response_x);
            }
            when 'QueryResultInt'
            {
                PermissionPartnerSoapSforceCom.queryResponse_element response_x = new PermissionPartnerSoapSforceCom.queryResponse_element();
                PermissionPartnerSoapSforceCom.QueryResult testQueryResultInt = new PermissionPartnerSoapSforceCom.QueryResult();
                response_x.result = testQueryResultInt;
                response.put('response_x',response_x);
            }
            when 'DescribeQuickActionResult'
            {
                PermissionPartnerSoapSforceCom.describeQuickActionsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeQuickActionsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeQuickActionResult> testQuickActionResult = new list<PermissionPartnerSoapSforceCom.DescribeQuickActionResult>();
                response_x.result = testQuickActionResult;
                response.put('response_x',response_x);
            }
            when 'PerformQuickActions'
            {
                PermissionPartnerSoapSforceCom.performQuickActionsResponse_element response_x = new PermissionPartnerSoapSforceCom.performQuickActionsResponse_element();
                list<PermissionPartnerSoapSforceCom.PerformQuickActionResult> testPerformQuickAction = new list<PermissionPartnerSoapSforceCom.PerformQuickActionResult>();
                response_x.result = testPerformQuickAction;
                response.put('response_x',response_x);
            }
            when 'DescribeSobjectResult'
            {
                PermissionPartnerSoapSforceCom.describeSObjectsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSObjectsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeSObjectResult> testDescribeSObjectResult = new list<PermissionPartnerSoapSforceCom.DescribeSObjectResult>();
                response_x.result = testDescribeSObjectResult;
                response.put('response_x',response_x);
            }
            when 'KnowledgeSettings'
            {
                PermissionPartnerSoapSforceCom.describeKnowledgeSettingsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeKnowledgeSettingsResponse_element();
                PermissionPartnerSoapSforceCom.KnowledgeSettings testKnowledgeSettings = new PermissionPartnerSoapSforceCom.KnowledgeSettings();
                response_x.result = testKnowledgeSettings;
                response.put('response_x',response_x);
            }
            when 'UndeleteResult'
            {
                PermissionPartnerSoapSforceCom.undeleteResponse_element response_x = new PermissionPartnerSoapSforceCom.undeleteResponse_element();
                list<PermissionPartnerSoapSforceCom.UndeleteResult> testUndeleteResult = new list<PermissionPartnerSoapSforceCom.UndeleteResult>();
                response_x.result = testUndeleteResult;
                response.put('response_x',response_x);
            }
            when 'DescribeTheme'
            {
                PermissionPartnerSoapSforceCom.describeThemeResponse_element response_x = new PermissionPartnerSoapSforceCom.describeThemeResponse_element();
                PermissionPartnerSoapSforceCom.DescribeThemeResult testDescribeTheme = new PermissionPartnerSoapSforceCom.DescribeThemeResult();
                response_x.result = testDescribeTheme;
                response.put('response_x',response_x);
            }
            when 'DeleteByExample'
            {
                PermissionPartnerSoapSforceCom.deleteByExampleResponse_element response_x = new PermissionPartnerSoapSforceCom.deleteByExampleResponse_element();
                list<PermissionPartnerSoapSforceCom.DeleteByExampleResult> testDeleteByExample = new list<PermissionPartnerSoapSforceCom.DeleteByExampleResult>();
                response_x.result = testDeleteByExample;
                response.put('response_x',response_x);
            }
            when 'DescribeNounResult'
            {
                PermissionPartnerSoapSforceCom.describeNounsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeNounsResponse_element();
                list<PermissionPartnerSoapSforceCom.DescribeNounResult> testDescribeNounResult = new list<PermissionPartnerSoapSforceCom.DescribeNounResult>();
                response_x.result = testDescribeNounResult;
                response.put('response_x',response_x);
            }
            when 'FindDuplicatesResult'
            {
                PermissionPartnerSoapSforceCom.findDuplicatesByIdsResponse_element response_x = new PermissionPartnerSoapSforceCom.findDuplicatesByIdsResponse_element();
                list<PermissionPartnerSoapSforceCom.FindDuplicatesResult> testDuplicatesResult = new list<PermissionPartnerSoapSforceCom.FindDuplicatesResult>();
                response_x.result = testDuplicatesResult;
                response.put('response_x',response_x);
            }
            when 'ExecuteListView'
            {
                PermissionPartnerSoapSforceCom.executeListViewResponse_element response_x = new PermissionPartnerSoapSforceCom.executeListViewResponse_element();
                PermissionPartnerSoapSforceCom.ExecuteListViewResult testExecuteListView = new PermissionPartnerSoapSforceCom.ExecuteListViewResult();
                response_x.result = testExecuteListView;
                response.put('response_x',response_x);
            }
            when 'RenderStoredEmailTemplate'
            {
                PermissionPartnerSoapSforceCom.renderStoredEmailTemplateResponse_element response_x = new PermissionPartnerSoapSforceCom.renderStoredEmailTemplateResponse_element();
                PermissionPartnerSoapSforceCom.RenderStoredEmailTemplateResult testRenderStoredEmailTemplate = new PermissionPartnerSoapSforceCom.RenderStoredEmailTemplateResult();
                response_x.result = testRenderStoredEmailTemplate;
                response.put('response_x',response_x);
            }
            when 'DescribeVisualForce'
            {
                PermissionPartnerSoapSforceCom.describeVisualForceResponse_element response_x = new PermissionPartnerSoapSforceCom.describeVisualForceResponse_element();
                PermissionPartnerSoapSforceCom.DescribeVisualForceResult testDescribeVisualForce = new PermissionPartnerSoapSforceCom.DescribeVisualForceResult();
                response_x.result = testDescribeVisualForce;
                response.put('response_x',response_x);
            }
            when 'DescribeSObject'
            {
                PermissionPartnerSoapSforceCom.describeSObjectResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSObjectResponse_element();
                PermissionPartnerSoapSforceCom.DescribeSObjectResult testDescribeSObject = new PermissionPartnerSoapSforceCom.DescribeSObjectResult();
                response_x.result = testDescribeSObject;
                response.put('response_x',response_x);
            }
            when 'GetServerTimestamp'
            {
                PermissionPartnerSoapSforceCom.getServerTimestampResponse_element response_x = new PermissionPartnerSoapSforceCom.getServerTimestampResponse_element();
                PermissionPartnerSoapSforceCom.GetServerTimestampResult testGetServerTimestamp = new PermissionPartnerSoapSforceCom.GetServerTimestampResult();
                response_x.result = testGetServerTimestamp;
                response.put('response_x',response_x);
            }
            when else {
                response = invokeWithIndicatorVar_2(indicatorVar, response);
            }
        }
        return response;
    }
    private static Map<string, object> invokeWithIndicatorVar_2(String indicatorVar, map<string, object> response){
        switch on indicatorVar{
            when 'RetrieveQuickActionTemplates'
            {
                PermissionPartnerSoapSforceCom.retrieveQuickActionTemplatesResponse_element response_x = new PermissionPartnerSoapSforceCom.retrieveQuickActionTemplatesResponse_element();
                list<PermissionPartnerSoapSforceCom.QuickActionTemplateResult> testRetrieveQuickActionTemplates = new list<PermissionPartnerSoapSforceCom.QuickActionTemplateResult>();
                response_x.result = testRetrieveQuickActionTemplates;
                response.put('response_x',response_x);
            }
            when 'SetPassword'
            {
                PermissionPartnerSoapSforceCom.setPasswordResponse_element response_x = new PermissionPartnerSoapSforceCom.setPasswordResponse_element();
                PermissionPartnerSoapSforceCom.SetPasswordResult testSetPassword = new PermissionPartnerSoapSforceCom.SetPasswordResult();
                response_x.result = testSetPassword;
                response.put('response_x',response_x);
            }
            when 'ResetPassword'
            {
                PermissionPartnerSoapSforceCom.resetPasswordResponse_element response_x = new PermissionPartnerSoapSforceCom.resetPasswordResponse_element();
                PermissionPartnerSoapSforceCom.ResetPasswordResult testResetPassword = new PermissionPartnerSoapSforceCom.ResetPasswordResult();
                response_x.result = testResetPassword;
                response.put('response_x',response_x);
            }
            when 'DescribeSoftphoneLayout'
            {
                PermissionPartnerSoapSforceCom.describeSoftphoneLayoutResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSoftphoneLayoutResponse_element();
                PermissionPartnerSoapSforceCom.DescribeSoftphoneLayoutResult testDescribeSoftphoneLayout = new PermissionPartnerSoapSforceCom.DescribeSoftphoneLayoutResult();
                response_x.result = testDescribeSoftphoneLayout;
                response.put('response_x',response_x);
            }
            when 'Create'
            {
                PermissionPartnerSoapSforceCom.createResponse_element response_x = new PermissionPartnerSoapSforceCom.createResponse_element();
                list<PermissionPartnerSoapSforceCom.SaveResult> testCreate = new list<PermissionPartnerSoapSforceCom.SaveResult>();
                response_x.result = testCreate;
                response.put('response_x',response_x);
            }
            when 'DescribeSearchLayouts'
            {
            PermissionPartnerSoapSforceCom.describeSearchLayoutsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSearchLayoutsResponse_element();
            list<PermissionPartnerSoapSforceCom.DescribeSearchLayoutResult> testCreate = new list<PermissionPartnerSoapSforceCom.DescribeSearchLayoutResult>();
            response_x.result = testCreate;
            response.put('response_x',response_x);
            }
            when 'Merge'
            {
            PermissionPartnerSoapSforceCom.mergeResponse_element response_x = new PermissionPartnerSoapSforceCom.mergeResponse_element();
            list<PermissionPartnerSoapSforceCom.MergeResult> testMerge = new list<PermissionPartnerSoapSforceCom.MergeResult>();
            response_x.result = testMerge;
            response.put('response_x',response_x);
            }
            when 'InvalidateSessions'
            {
            PermissionPartnerSoapSforceCom.invalidateSessionsResponse_element response_x = new PermissionPartnerSoapSforceCom.invalidateSessionsResponse_element();
            list<PermissionPartnerSoapSforceCom.InvalidateSessionsResult> testInvalidateSessions = new list<PermissionPartnerSoapSforceCom.InvalidateSessionsResult>();
            response_x.result = testInvalidateSessions;
            response.put('response_x',response_x);
            }
            when 'DescribeDataCategoryMappings'
            {
            PermissionPartnerSoapSforceCom.describeDataCategoryMappingsResponse_element response_x = new PermissionPartnerSoapSforceCom.describeDataCategoryMappingsResponse_element();
            list<PermissionPartnerSoapSforceCom.DescribeDataCategoryMappingResult> testDescribeDataCategoryMappings = new list<PermissionPartnerSoapSforceCom.DescribeDataCategoryMappingResult>();
            response_x.result = testDescribeDataCategoryMappings;
            response.put('response_x',response_x);
            }
            when 'Logout'
            {
            PermissionPartnerSoapSforceCom.logoutResponse_element response_x = new PermissionPartnerSoapSforceCom.logoutResponse_element();
            response.put('response_x',response_x);
            }
            when 'DescribeSearchScopeOrder'
            {
            PermissionPartnerSoapSforceCom.describeSearchScopeOrderResponse_element response_x = new PermissionPartnerSoapSforceCom.describeSearchScopeOrderResponse_element();
            list<PermissionPartnerSoapSforceCom.DescribeSearchScopeOrderResult> testDescribeSearchScopeOrder = new list<PermissionPartnerSoapSforceCom.DescribeSearchScopeOrderResult>();
            response_x.result = testDescribeSearchScopeOrder;
            response.put('response_x',response_x);
            }
            when 'Retrieve'
            {
                PermissionPartnerSoapSforceCom.retrieveResponse_element response_x = new PermissionPartnerSoapSforceCom.retrieveResponse_element();
                list<PermissionSobjectPartnerSoapSforceCom.sObject_x> testRetrieve = new list<PermissionSobjectPartnerSoapSforceCom.sObject_x>();
                response_x.result = testRetrieve;
                response.put('response_x',response_x);
            }
            when else
            {
                System.debug('Invalid Indicator Value');
            }
        }
        return response;
    }
}