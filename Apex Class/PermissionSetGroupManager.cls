//This class is used for create,edit,delete,clone functionality for Permission Set Group.
public with sharing class PermissionSetGroupManager {	
    public static final String MUTED_LABEL = ' Muted';
    public static final String MUTED_DEV_NAME = '_Muted';
    // Constants
    private static final Integer QUERY_LIMIT = 50000;
    private static final String ERROR_INVALID_PARAMS = 'Required parameters are missing or invalid';
    private static final String ERROR_NO_ACCESS = 'Insufficient access rights';
    
    // Cache maps for better performance
    private static Map<Id, List<PermissionSetGroupComponent>> permSetCompCache = new Map<Id, List<PermissionSetGroupComponent>>();
    private static Map<String, Boolean> duplicateCheckCache = new Map<String, Boolean>();
    
    //This method is used to fetch permission set group details.
    @AuraEnabled(cacheable=true)
    public static List<permissionSetGroupWrapper> getPermissionSetGrp() {
        try {
            // Bulkified queries
            Map<Id, List<PermissionSetGroupComponent>> permSetCompMap = new Map<Id, List<PermissionSetGroupComponent>>();
            
            // Single query for components with license info
            for (PermissionSetGroupComponent comp : [
                SELECT Id, PermissionSetId, PermissionSet.License.Name, PermissionSetGroupId 
                FROM PermissionSetGroupComponent 
                WHERE PermissionSet.License.Name != NULL 
                LIMIT :QUERY_LIMIT
            ]) {
                if (!permSetCompMap.containsKey(comp.PermissionSetGroupId)) {
                    permSetCompMap.put(comp.PermissionSetGroupId, new List<PermissionSetGroupComponent>());
                }
                permSetCompMap.get(comp.PermissionSetGroupId).add(comp);
            }
            
            // Cache the results
            permSetCompCache = permSetCompMap;
            
            return buildPermissionSetGroupWrappers(permSetCompMap);
        } catch (Exception e) {
            handleException('Error retrieving permission set groups', e);
            return null;
        }
    }  
    //wrapper class to fetch permission set group details.
    public class PermissionSetGroupWrapper{
        @AuraEnabled public String perSetId { get; set; }
        @AuraEnabled public String perSetGrpId { get; set;}
        @AuraEnabled public String DeveloperName { get; set;}
        @AuraEnabled public String MasterLabel { get; set;}
        @AuraEnabled public String Description { get; set;}
        @AuraEnabled public String Status { get; set;}
        @AuraEnabled public String NamespacePrefix { get; set;}
        @AuraEnabled public String CreatedById { get; set;}
        @AuraEnabled public String CreatedByName { get; set;}
        @AuraEnabled public Datetime CreatedDate { get; set;}
        @AuraEnabled public String LastModifiedById { get; set;}
        @AuraEnabled public String LastModifiedByName { get; set;}
        @AuraEnabled public Datetime LastModifiedDate { get; set;}
        @AuraEnabled public Boolean sameLicense { get; set;}
    }  
    //This method is used for creation of permission set group.
    @AuraEnabled(cacheable=false)
    public static void createPermissionSetGroup(String label, String apiName, String description, List<String> permissionSetIds, Boolean isRequired) {
        // Input validation
        if (String.isBlank(label) || String.isBlank(apiName) || permissionSetIds == null) {
            throw new AuraHandledException(ERROR_INVALID_PARAMS);
        }

        Savepoint sp = Database.setSavepoint();
        try {
            // Create group
            PermissionSetGroup newGroup = new PermissionSetGroup(
                MasterLabel = label,
                DeveloperName = apiName.replaceAll(' ', '_'),
                Description = description,
                HasActivationRequired = isRequired
            );
            insert newGroup;

            // Bulk create components
            List<PermissionSetGroupComponent> groupComponents = new List<PermissionSetGroupComponent>();
            for (String permissionSetId : permissionSetIds) {
                groupComponents.add(new PermissionSetGroupComponent(
                    PermissionSetGroupId = newGroup.Id,
                    PermissionSetId = permissionSetId
                ));
            }
            insert groupComponents;

        } catch (Exception e) {
            Database.rollback(sp);
            handleException('Error creating Permission Set Group', e);
        }
    }
    //This method is used for editing permission set group.
    @AuraEnabled
    public static PermissionSetGroup editPermissionSetGrp(String perSetId, String label, String apiName, String description, String format) {
        PermissionSetGroup perSet;
        String query = 'SELECT id, DeveloperName, MasterLabel, Description, Status, NamespacePrefix, CreatedById, CreatedBy.Name, CreatedDate, LastModifiedById, LastModifiedBy.Name, LastModifiedDate FROM PermissionSetGroup WHERE ';
        try {
            if (format == 'group') {
                query += 'id = :perSetId LIMIT 1';
                perSet = Database.query(query);
            } else if (format == 'permission set') {
                String permissionSetGroupId = [SELECT PermissionSetGroupId FROM PermissionSet WHERE id =: perSetId LIMIT 1].PermissionSetGroupId;
                if (permissionSetGroupId == null) {
                    handleException('No PermissionSetGroup found for the provided PermissionSet ID.', null);
                }
                query += 'id = :permissionSetGroupId LIMIT 1';
                perSet = Database.query(query);
            } else {
                handleException('Invalid format provided. Must be "group" or "permission set".', null);
            }
            if (perSet != null) {
                perSet.MasterLabel = label;
                perSet.DeveloperName = apiName;
                perSet.Description = description;
                update perSet;
            }
        } catch (Exception e) {
            handleException('Error processing PermissionSetGroup: ', e);
        }      
        return perSet;
    } 
    // This method is used for cloning permission set group along with permission sets.
    @AuraEnabled
    public static void clonePermissionSetGroup(String sourcePermissionSetGroupName,String newLabel,String newApiName,String newDescription) {
        try {
            PermissionSetGroup sourcePSG = [SELECT Id, MasterLabel, DeveloperName, Description FROM PermissionSetGroup WHERE MasterLabel = :sourcePermissionSetGroupName LIMIT 1];
            PermissionSetGroup newPSG = new PermissionSetGroup();
            newPSG.MasterLabel = newLabel;
            newPSG.DeveloperName = newApiName.replaceAll(' ', '_');
            newPSG.Description = newDescription;
            insert newPSG; 
            Id newPSGId = newPSG.Id;
            List<PermissionSetGroupComponent> sourceComponents = [SELECT PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :sourcePSG.Id];
            Set<Id> permissionSetIds = new Set<Id>();
            for (PermissionSetGroupComponent component : sourceComponents) {
                permissionSetIds.add(component.PermissionSetId);
            }
            Set<Id> newpermissionSetIds = new Set<Id>();
            List<PermissionSet> perset = [SELECT Id FROM PermissionSet WHERE Id IN :permissionSetIds];
            for (PermissionSet component : perset) {
                newpermissionSetIds.add(component.Id);
            }
            List<PermissionSetGroupComponent> newComponents = new List<PermissionSetGroupComponent>();
            for (Id component : newpermissionSetIds) {
                PermissionSetGroupComponent newComponent = new PermissionSetGroupComponent();
                newComponent.PermissionSetGroupId = newPSGId;
                newComponent.PermissionSetId = component;
                newComponents.add(newComponent);
            }
            insert newComponents;
            List<PermissionSetAssignment> assignedUsers = [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetGroupId = :sourcePSG.Id];
            Set<Id> assignedUserIds = new Set<Id>();
            for (PermissionSetAssignment psa : assignedUsers) {
                assignedUserIds.add(psa.AssigneeId);
            }
            List<User> userList = [SELECT id,Name,Username,Profile.Name,IsActive,Profile.UserLicense.Name FROM user WHERE IsActive = TRUE AND Id IN :assignedUserIds];
            Set<Id> userids = new Set<Id>();
            for (User psa : userList) {
                userids.add(psa.id);
            }
            List<PermissionSetAssignment> persetasi = new List<PermissionSetAssignment>();
            for (Id assignId : userids) {
                PermissionSetAssignment perasi = new PermissionSetAssignment();
                perasi.AssigneeId = assignId;
                perasi.PermissionSetGroupId = newPSGId;
                persetasi.add(perasi);
            }       
            try {
                insert persetasi;
            } catch (DmlException e) {
                handleException('Error cloning Permission Set Group: ', e);
            }
        } catch (Exception e) {
            handleException('Error cloning Permission Set Group: ', e);
        }
    }
    // This method is used to delete permission set group.
    @AuraEnabled
    public static void deletePermissionSetGroupWithUnassignments(String permissionSetGroupId) {
        try {
            List<PermissionSetAssignment> assignmentsToDelete = [SELECT Id FROM PermissionSetAssignment WHERE PermissionSetGroupId = :permissionSetGroupId];
            List<PermissionSetGroupComponent> componentsToDelete = [SELECT Id FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :permissionSetGroupId];
            PermissionSetGroup permissionSetGroupToDelete = [SELECT Id FROM PermissionSetGroup WHERE Id = :permissionSetGroupId]; 
            List<SObject> recordsToDelete = new List<SObject>();
            recordsToDelete.addAll(assignmentsToDelete);
            recordsToDelete.addAll(componentsToDelete);
            recordsToDelete.add(permissionSetGroupToDelete);          
            if (!recordsToDelete.isEmpty()) {
                delete recordsToDelete;
            } else {
                System.debug('No records found for the Permission Set Group.');
            }
        } catch (Exception e) {
            handleException('Error deleting Permission Set Group: ', e);
        }
    }
    //This method is used to show list of users for Permission Set group to assign.
    @AuraEnabled
    public static List<User> getUserPermissionSetGroup(String profileName, String userLicense, String perSetGrpId_tofetch) {
        List<PermissionSetAssignment> assignedUsers = [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetGroupId = :perSetGrpId_tofetch];
        Set<Id> assignedUserIds = new Set<Id>();
        for (PermissionSetAssignment psa : assignedUsers) {
            assignedUserIds.add(psa.AssigneeId);
        }
        String query = 'SELECT Id, Name, Username, Profile.Name, IsActive, Profile.UserLicense.Name ' +
            'FROM User ' +
            'WHERE IsActive = true AND Id NOT IN :assignedUserIds';
        if (String.isNotBlank(profileName) && profileName != 'All') {
            query += ' AND Profile.Name = \'' + String.escapeSingleQuotes(profileName) + '\'';
        }
        if (String.isNotBlank(userLicense) && userLicense != 'All') {
            query += ' AND Profile.UserLicense.Name = \'' + String.escapeSingleQuotes(userLicense) + '\'';
        }
        query += ' ORDER BY Name ASC limit 5000';
        List<User> userList = Database.query(query);
        return userList;
    }
    //This method is used to assign users to Permission Set Groups, retrieve users assigned to groups, and list users who are eligible to be assigned to a group.
    @AuraEnabled
    public static void getPermissionGroup(List<String> userId,String perGrp_Id) {
        List<PermissionSetAssignment> persetasi = new List<PermissionSetAssignment>();
        for (String assignId : userId) {
            PermissionSetAssignment perasi = new PermissionSetAssignment();
            perasi.AssigneeId = assignId;
            perasi.PermissionSetGroupId = perGrp_Id;
            persetasi.add(perasi);
        }
        try {
            insert persetasi;
        } catch (DmlException e) {
            handleException('Error in fetching Permission Set Group: ', e);
        }
    }
    //This method is used to retrieve list of users who are already assigned to a specified Permission Set Group.
    @AuraEnabled
    public static List<User> getPermissionSetGroup(String perSetGrp_Id) {
        List<PermissionSetAssignment> persetaList = [SELECT PermissionSetGroupId, AssigneeId FROM PermissionSetAssignment WHERE PermissionSetGroupId = :perSetGrp_Id];
        Set<Id> userIds = new Set<Id>();
        for (PermissionSetAssignment perseta : persetaList) {
            userIds.add(perseta.AssigneeId);
        }
        List<User> users = [SELECT id, Name, Username, Profile.Name, Profile.UserLicense.Name FROM User WHERE Id IN :userIds ORDER BY Name ASC limit 5000];
        return users;
    }
    // This method deletes the assignments of users from a specified Permission Set Group.
    @AuraEnabled
    public static void deletePermissionGroup(List<String> userId,String delPerGrpId) {
        List<PermissionSetAssignment> persetAssignForDlt = [SELECT id FROM PermissionSetAssignment WHERE AssigneeId IN :userId AND PermissionSetGroupId = :delPerGrpId];
        try {
            delete persetAssignForDlt;
        } catch (DmlException e) {
            handleException('Error in deleting Permission Set Group: ', e);
        }
    }
    //This method is used to retrieve profiles.
    @AuraEnabled
    public static List<Profile> getProfiles() {
        return [SELECT id, Name, UserLicense.Name FROM Profile ORDER BY name ASC limit 5000];
    }
    //This method is used to retrieve Permission set list.
    @AuraEnabled
    public static List<PermissionSet> getPermissionSet(String permissionSetGroupId, String searchperset) {
        String typeValue = 'Group';
        List<PermissionSetGroupComponent> groupComponents = [SELECT PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :permissionSetGroupId];    
        Set<Id> permissionSetIds = new Set<Id>();
        for (PermissionSetGroupComponent component : groupComponents) {
            permissionSetIds.add(component.PermissionSetId);
        }
        String query = 'SELECT Id, Name, Label, Description, LicenseId, License.Name, IsCustom, CreatedById, ' +
            'CreatedBy.Name, CreatedDate, LastModifiedById, LastModifiedBy.Name, LastModifiedDate, NamespacePrefix ' +
            'FROM PermissionSet ' +
            'WHERE Id NOT IN :permissionSetIds AND IsOwnedByProfile = false AND Type != \'' + typeValue + '\'';      
        if (String.isNotBlank(searchperset)) {
            String searchName = '%' + String.escapeSingleQuotes(searchperset) + '%';
            query += ' AND Label LIKE \'' + searchName + '\'';
        }      
        query += ' ORDER BY Label ASC limit 5000';
        List<PermissionSet> perset = Database.query(query);
        return perset;
    }
    //This method is used to assign permission set to permission set group.
    @AuraEnabled
    public static void insertPermissionSet(List<String> permissionSetId,String permissionSetGroupId) {
        List<PermissionSetGroupComponent> persetasi = new List<PermissionSetGroupComponent>();
        for (String permissionId : permissionSetId) {
            PermissionSetGroupComponent perasi = new PermissionSetGroupComponent();
            perasi.PermissionSetId = permissionId;
            perasi.PermissionSetGroupId = permissionSetGroupId;
            persetasi.add(perasi);
        }
        try {
            insert persetasi;
        } catch (DmlException e) {
            handleException('Error in creating Permission Set Group: ', e);
        }
    }
    //This method is used to unassign permission set from permission set group.
    @AuraEnabled
    public static void deletePermissionSet(List<String> permissionSetId,String delPerSetId) {
        List<PermissionSetGroupComponent> persetAssignForDlt = [SELECT id FROM PermissionSetGroupComponent WHERE PermissionSetId IN :permissionSetId AND PermissionSetGroupId = :delPerSetId];
        try {
            delete persetAssignForDlt;
        } catch (DmlException e) {
            handleException('Error deleting Permission Set Group components', e);
        }
    }
    //This method is used to fetch assigned permission set list related to permission set group.
    @AuraEnabled
    public static List<PermissionSet> getAssignedPermissionSet(String permissionSetGroupId) {
        List<PermissionSetGroupComponent> groupComponents = [SELECT PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = :permissionSetGroupId];
        Set<Id> permissionSetIds = new Set<Id>();
        for (PermissionSetGroupComponent component : groupComponents) {
            permissionSetIds.add(component.PermissionSetId);
        }
        List<PermissionSet> perset = [SELECT Id,Name,Label,Description,License.Name,IsCustom,CreatedById,CreatedBy.Name,CreatedDate,LastModifiedById,LastModifiedBy.Name,LastModifiedDate FROM PermissionSet WHERE Id IN :permissionSetIds AND IsOwnedByProfile = FALSE ORDER BY Label ASC limit 5000];
        return perset;
    }
    //This method is used to fetch permission sets.
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getSetPermission() {      
        List<Map<String, String>> result = new List<Map<String, String>>();  
        List<PermissionSet> permissionSets = [SELECT Id, Name, Label, Description, IsCustom, NamespacePrefix, CreatedDate, LastModifiedDate,License.Name, CreatedBy.Name, LastModifiedBy.Name FROM PermissionSet WHERE IsOwnedByProfile = false AND Type != 'Group'];
        for (PermissionSet ps : permissionSets) {
            Map<String, String> recordMap = new Map<String, String>();
            recordMap.put('Id', ps.Id);
            recordMap.put('Name', ps.Name);
            recordMap.put('Label', ps.Label);
            recordMap.put('Description', ps.Description);
            recordMap.put('IsCustom', String.valueOf(ps.IsCustom));
            recordMap.put('NamespacePrefix', ps.NamespacePrefix);
            recordMap.put('CreatedDate', String.valueOf(ps.CreatedDate));
            recordMap.put('LastModifiedDate', String.valueOf(ps.LastModifiedDate));          
            if (ps.License != null) {
                recordMap.put('LicenseId', ps.License.Id);
                recordMap.put('LicenseName', ps.License.Name);
            } else {
                System.debug('License Name not found for Permission set ID: ' + ps.Id);
            }          
            if (ps.CreatedBy != null) {
                recordMap.put('CreatedById', ps.CreatedBy.Id);
                recordMap.put('CreatedByName', ps.CreatedBy.Name);
            } else {
                System.debug('CreatedBy Name not found for Permission set ID: ' + ps.Id);
            }          
            if (ps.LastModifiedBy != null) {
                recordMap.put('LastModifiedById', ps.LastModifiedBy.Id);
                recordMap.put('LastModifiedByName', ps.LastModifiedBy.Name);
            } else {
                System.debug('LastModifiedBy Name not found for Permission set ID: ' + ps.Id);
            }      
            result.add(recordMap);
        }  
        return result;
    }
    //This method is used to fetch permission set lists.
    @AuraEnabled(cacheable=true)
    public static List<PermissionSet> getProfileDetails() {
        return [SELECT Id,ProfileId,Profile.Name,Profile.UserLicense.Name,Profile.Description,Profile.UserType,IsOwnedByProfile,isCustom FROM Permissionset WHERE IsOwnedByProfile = TRUE ORDER BY Profile.Name ASC limit 5000];
    }
    //This method is used to display assigned users in permission set group.
    @AuraEnabled
    public static List<user> getUnAssignedUserForPermissionSet(String permissionSetId,String profileName,String userLicense,String licenseName) { 
        List<PermissionSetAssignment> permissionSetAssignments = [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSet.Id = :permissionSetId];
        Set<Id> assigneeIds = new Set<Id>();
        for (PermissionSetAssignment psa : permissionSetAssignments) {
            if (psa.AssigneeId != null) {
                assigneeIds.add(psa.AssigneeId);
            }
        }      
        List<String> assigneeIdsList = new List<String>();
        for (Id id : assigneeIds) {
            assigneeIdsList.add(id);
        }
        String query = 'SELECT Id, Name, Username, Profile.Name, IsActive, Profile.UserLicense.Name ' +
            'FROM User ' + 'WHERE IsActive = true AND Id NOT IN :assigneeIdsList';      
        if (String.isNotBlank(profileName) && profileName != 'All') {
            query += ' AND Profile.Name = :profileName';
        }
        if (String.isNotBlank(licenseName)) {
            query += ' AND Profile.UserLicense.Name = :licenseName';
        }
        query += ' ORDER BY Name ASC limit 5000';
        List<User> userList = Database.query(query);
        return userList;
    }  
    //This method is used to check duplicate label & api name while creating new permission set group.
    @AuraEnabled(cacheable=true)
    public static Boolean checkDuplicatePermissionSetGroup(String label,String apiName) {
        List<PermissionSetGroup> existingSets = [SELECT Id FROM PermissionSetGroup WHERE MasterLabel = :label OR DeveloperName = :apiName];
        return existingSets.size() > 0;
    }  
    //Wrapper class for system,object,muted Object,field,muted field permissions.
    public class UserObjAndFieldPermissionSetGroupWrapper {
          @AuraEnabled public List<CombinedPermissionsWrapper> combinedPermissions { get; set; }
          @AuraEnabled public Map<String, ObjectPermissions> objectPermissions { get; set; }
          @AuraEnabled public Map<String, ObjectPermissions> mutingobjectPermissions { get; set; }
          @AuraEnabled public Map<String, List<fieldPermissions>> fieldPermissions { get; set; }
          @AuraEnabled public Map<String, List<fieldPermissions>> mutingfieldPermissions { get;set; }
          @AuraEnabled public List<Object> systemDependencies { get; private set; }
          public UserObjAndFieldPermissionSetGroupWrapper(
              List<CombinedPermissionsWrapper> combinedPermissions,
              Map<String, ObjectPermissions> objectPermissions,
              Map<String, ObjectPermissions> mutingobjectPermissions,
              Map<String, List<fieldPermissions>> fieldPermissions,
              Map<String, List<fieldPermissions>> mutingfieldPermissions,
              List<Object> systemDependencies
          ) {
              this.combinedPermissions = combinedPermissions;
              this.objectPermissions = objectPermissions;
              this.mutingobjectPermissions = mutingobjectPermissions;
              this.fieldPermissions = fieldPermissions;
              this.mutingfieldPermissions = mutingfieldPermissions;
              this.systemDependencies = systemDependencies;
          }
      }  
    public class CombinedPermissionsWrapper {
          @AuraEnabled public String fieldName;
          @AuraEnabled public String fieldLabel;
          @AuraEnabled public Object fieldValue;
          @AuraEnabled public Object mutedValue;
          @AuraEnabled public String mutedId;
          @AuraEnabled public Boolean hasDependencies;
          @AuraEnabled public List<String> requiredPermissions;
        public CombinedPermissionsWrapper(String fieldName,String fieldLabel,Object fieldValue,Object mutedValue,String mutedId) {
            this.fieldName = fieldName;
            this.fieldLabel = fieldLabel;
            this.fieldValue = fieldValue;
            this.mutedValue = mutedValue;
            this.mutedId = mutedId;
            this.hasDependencies = false;
            this.requiredPermissions = new List<String>();     
        }
    } 
    //Helper method for checking dependencies.
    private static Map<String, List<String>> checkForDependencies(Set<String> fieldNames,Boolean isUpdateSystemPermissions) {
        Map<String, List<String>> fieldPermissionsMap = new Map<String, List<String>>();
        if (fieldNames.isEmpty()) {
            return fieldPermissionsMap;
        }
        List<String> quotedFieldNames = new List<String>();
        for (String fieldName : fieldNames) {
            quotedFieldNames.add('\'' + fieldName + '\'');
        }
        String query = buildPermissionDependencyQuery(isUpdateSystemPermissions, quotedFieldNames);
        String baseUrl = System.URL.getOrgDomainUrl().toExternalForm();
        String endpoint = baseUrl + '/services/data/v58.0/tooling/query?q=' + EncodingUtil.urlEncode(query, 'UTF-8');
        UserAccessManager instance = new UserAccessManager();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization','Bearer ' + instance.partnerConnection.SessionHeader.sessionId);
        req.setHeader('Content-Type', 'application/json');
        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(
                res.getBody()
            );
            List<Object> records = (List<Object>) result.get('records');
            fieldPermissionsMap = fetchFieldPermissionsMap(records, isUpdateSystemPermissions);
        } else {
            System.debug('Error: ' + res.getBody());
        }
        return fieldPermissionsMap;
    }
    
    // This method is called from checkForDependencies to build permission dependency query
    private static String buildPermissionDependencyQuery(Boolean isUpdateSystemPermissions, List<String> quotedFieldNames){
        String query = '';
        if (isUpdateSystemPermissions) {
            string usertype = 'User Permission';
            query =
                'SELECT RequiredPermission, Permission FROM PermissionDependency WHERE Permission IN (' +
                String.join(quotedFieldNames, ',') +
                ') AND RequiredPermissionType = \'' + usertype + '\'';
        } else {
            query =
                'SELECT RequiredPermission, Permission FROM PermissionDependency WHERE RequiredPermission IN (' +
                String.join(quotedFieldNames, ',') +
                ')';
        }
        return query;
    }
    

    // This method is called from checkForDependencies to fetch field permissions map
    private static Map<String, List<String>> fetchFieldPermissionsMap(List<Object> records, Boolean isUpdateSystemPermissions){
        Map<String, List<String>> fieldPermissionsMap = new Map<String, List<String>>();
        for (Object record : records) {
            Map<String, Object> recordMap = (Map<String, Object>) record;
            if (isUpdateSystemPermissions) {
                String requiredPermission = ((String) recordMap.get('Permission'));
                String permission = (String) recordMap.get('RequiredPermission');
                if (!fieldPermissionsMap.containsKey(requiredPermission)) {
                    fieldPermissionsMap.put(requiredPermission, new List<String>());
                }
                fieldPermissionsMap.get(requiredPermission).add(permission);
            } else {
                String requiredPermission = ((String) recordMap.get(
                    'RequiredPermission'
                ));
                String permission = (String) recordMap.get('Permission');
                if (!fieldPermissionsMap.containsKey(requiredPermission)) {
                    fieldPermissionsMap.put(requiredPermission, new List<String>());
                }
                fieldPermissionsMap.get(requiredPermission).add(permission);
            }
        }
        return fieldPermissionsMap;
    }
    //This method is used to get user permissions/system permissions for permission set.
    @AuraEnabled(cacheable=false) 
    public static UserObjAndFieldPermissionSetGroupWrapper getCombinedPermissions(String permissionSetGroupId,string persetapi,string persetname) {     
        List<CombinedPermissionsWrapper> combinedPermissions = new List<CombinedPermissionsWrapper>();
        String baseQueryString = 'SELECT Id, Name';
        Map<String, Schema.SObjectField> baseFields = Schema.SObjectType.PermissionSet.fields.getMap();        
        for (Schema.SObjectField field : baseFields.values()) {
            String fieldName = field.getDescribe().getName();
            if (fieldName.startsWith('Permissions') && fieldName != 'Permissionsetgroupid') {
                baseQueryString += ', ' + field;
                String fieldLabel = field.getDescribe().getLabel();
                combinedPermissions.add(
                    new CombinedPermissionsWrapper(fieldName,fieldLabel,null,null,null)
                );
            }
        }
        List<PermissionSetGroupComponent> groupComponents = [SELECT PermissionSetId FROM PermissionSetGroupComponent
                                                            WHERE PermissionSetGroupId = :permissionSetGroupId
                                                            ];
        Set<Id> permissionSetIds = new Set<Id>();
        for (PermissionSetGroupComponent component : groupComponents) {
            permissionSetIds.add(component.PermissionSetId);
        }
        baseQueryString += ' FROM PermissionSet WHERE Id IN :permissionSetIds';
        List<PermissionSet> basePermissionSets = (List<PermissionSet>) Database.query(
            baseQueryString
        );
        combinedPermissions = setCombinedPermissionsFieldValue(basePermissionSets, combinedPermissions);
        
        String nullValue = '%_%';
        list<PermissionSetGroupComponent> per = [SELECT id,PermissionSetId,PermissionSet.Name,PermissionSetGroupId,PermissionSetGroup.DeveloperName FROM PermissionSetGroupComponent
                                                WHERE
                                                PermissionSetGroupId = :permissionSetGroupId
                                                AND (NOT PermissionSet.Name LIKE :nullValue)
                                                ];
        String ids;
        for (PermissionSetGroupComponent pe : per) {
            ids = pe.PermissionSetId;
        }
        Map<String, Schema.SObjectField> baseMuteFields = Schema.SObjectType.MutingPermissionSet.fields.getMap();
        String baseMuteString = 'SELECT Id, DeveloperName';
        for (String fieldName : baseMuteFields.keySet()) {
            if (fieldName.startsWith('permissions')) {
                baseMuteString += ', ' + fieldName;
            }
        }
        baseMuteString += ' FROM MutingPermissionSet WHERE Id =: ids';
        List<MutingPermissionSet> mute = Database.query(baseMuteString);
        combinedPermissions = setCombinedPermissionsMuteValue(mute, combinedPermissions);

        Set<String> requiredPermissionFields = new Set<String>();
        for (CombinedPermissionsWrapper wrapper : combinedPermissions) {    
            String initialRequiredPermission = wrapper.fieldName.remove('Permissions');
            requiredPermissionFields.add(initialRequiredPermission);     
        }
        Map<String, List<String>> fieldPermissionsMap = checkForDependencies(requiredPermissionFields,false);
        combinedPermissions = setCombinedPermissionsDependencies(fieldPermissionsMap, combinedPermissions);

        Set<String> seenPermissions = new Set<String>();
        List<CombinedPermissionsWrapper> truePermissions = new List<CombinedPermissionsWrapper>();
        for (CombinedPermissionsWrapper wrapper : combinedPermissions) {     
            if (!seenPermissions.contains(wrapper.fieldName)) {
                truePermissions.add(wrapper);
                seenPermissions.add(wrapper.fieldName);
            }
        }
        Map<string, ObjectPermissions> objectPermissions = PermissionSetGroupManager.getObjectPermissionsforPSG(permissionSetGroupId);
        Map<string, ObjectPermissions> mutingobjectPermissions = PermissionSetGroupManager.getmutingObjectPermissionsforPSG(permissionSetGroupId,persetapi,persetname);
        Map<String, List<fieldPermissions>> fieldPermissions = PermissionSetGroupManager.getFieldPermissionspsg(permissionSetGroupId);
        Map<String, List<fieldPermissions>> mutingfieldPermissions = PermissionSetGroupManager.getmutingFieldPermissionspsg(permissionSetGroupId);
        List<Object> systemDependency= UserPermissionAnalyzerServer.getUserPermissionUserDependency();
        return new userObjAndFieldPermissionSetGroupWrapper(truePermissions,objectPermissions,mutingobjectPermissions,fieldPermissions,mutingfieldPermissions,systemDependency);
    }

    //This method is called from getCombinedPermissions to set Combined Permissions field value
    private static List<CombinedPermissionsWrapper> setCombinedPermissionsFieldValue(List<PermissionSet> basePermissionSets, List<CombinedPermissionsWrapper> combinedPermissions){
        for (PermissionSet basePermissionSet : basePermissionSets) {
        for (CombinedPermissionsWrapper wrapper : combinedPermissions) {
            String fieldName = wrapper.fieldName;
            Object fieldValue = basePermissionSet.get(fieldName);
            if (fieldValue == true || wrapper.fieldValue == null || wrapper.fieldValue == false) {
                wrapper.fieldValue = fieldValue;
            }
        }
    }
    return combinedPermissions;
    }

    //This method is called from getCombinedPermissions to set Combined Permissions mute value
    private static List<CombinedPermissionsWrapper> setCombinedPermissionsMuteValue(List<MutingPermissionSet> mute, List<CombinedPermissionsWrapper> combinedPermissions){
        for (MutingPermissionSet mutePermissionSet : mute) {
            for (CombinedPermissionsWrapper wrapper : combinedPermissions) {
                String fieldName = wrapper.fieldName;
                Object mutedValue = mutePermissionSet.get(wrapper.fieldName);
                wrapper.mutedValue = mutedValue;
                wrapper.mutedId = mutePermissionSet.Id;
            }
        }
        return combinedPermissions;
    }

    //This method is called from getCombinedPermissions to set Combined Permissions dependencies
    private static List<CombinedPermissionsWrapper> setCombinedPermissionsDependencies(Map<String, List<String>> fieldPermissionsMap, List<CombinedPermissionsWrapper> combinedPermissions){
        for (CombinedPermissionsWrapper wrapper : combinedPermissions) {
            String initialRequiredPermission = wrapper.fieldName.remove('Permissions');
            if (fieldPermissionsMap.containskey(initialRequiredPermission)) {
                wrapper.hasDependencies = true;
                wrapper.requiredPermissions.addAll(
                    fieldPermissionsMap.get(initialRequiredPermission)
                );
            }
        }
        return combinedPermissions;
    }

    //Helper method to retrieve object permissions of group.
    @AuraEnabled
    public static Map<String, ObjectPermissions> getObjectPermissionsforPSG(String parent_persetgrpid)
    {
          Map<String, ObjectPermissions> objMap = new Map<String, ObjectPermissions>();
          List<ObjectPermissions> objPermissions = [SELECT SobjectType,PermissionsRead,PermissionsCreate,PermissionsEdit,PermissionsDelete,PermissionsViewAllRecords,PermissionsModifyAllRecords
                                                    FROM ObjectPermissions
                                                    WHERE Parent.PermissionSetGroupId = :parent_persetgrpid
                                                   ];
          for (ObjectPermissions obj : objPermissions) {
              if (!objMap.containsKey(obj.SobjectType)) {
                  objMap.put(obj.SobjectType, obj);
              }
          }
          return objMap;
     }
    //Helper method to get muted object permissions.
    @AuraEnabled
    public static Map<String, ObjectPermissions> getmutingObjectPermissionsforPSG(String muting_persetgrpid,String psgapiname,String psgname)
    {
          Map<String, ObjectPermissions> objMap = new Map<String, ObjectPermissions>();
          String nullValue = '%_%';
          list<PermissionSetGroupComponent> per = [SELECT id,PermissionSetId,PermissionSet.Name,PermissionSetGroupId,PermissionSetGroup.DeveloperName
                                                   FROM PermissionSetGroupComponent
                                                   WHERE PermissionSetGroupId = :muting_persetgrpid AND (NOT PermissionSet.Name LIKE :nullValue)];
          String perSet_ids;
          for (PermissionSetGroupComponent pe : per) {
              perSet_ids = pe.PermissionSetId;
          }
          List<MutingPermissionSet> mpsList = [SELECT id FROM MutingPermissionSet WHERE id = :perSet_ids];
          MutingPermissionSet mutingPermissionSet;
          if (!mpsList.isEmpty()) {
              mutingPermissionSet = mpsList[0];
              perSet_ids = mutingPermissionSet.Id;
          } else {
              mutingPermissionSet = new MutingPermissionSet();
              mutingPermissionSet.MasterLabel = psgname + MUTED_LABEL;
              mutingPermissionSet.DeveloperName = psgapiname + MUTED_DEV_NAME;
              insert mutingPermissionSet;
              perSet_ids = mutingPermissionSet.Id;
              PermissionSetGroup psGroup = [SELECT Id FROM PermissionSetGroup WHERE Id = :muting_persetgrpid LIMIT 1];
              PermissionSetGroupComponent component = new PermissionSetGroupComponent(
                  PermissionSetGroupId = psGroup.Id,
                  PermissionSetId = mutingPermissionSet.Id
              );
              insert component;
          }
          List<ObjectPermissions> objPermissions = [SELECT SobjectType,PermissionsRead,PermissionsCreate,PermissionsEdit,PermissionsDelete,PermissionsViewAllRecords,PermissionsModifyAllRecords
                                                    FROM ObjectPermissions
                                                    WHERE ParentId = :perSet_ids
                                                   ];
          for (ObjectPermissions obj : objPermissions) {
              if (!objMap.containsKey(obj.SobjectType)) {
                  objMap.put(obj.SobjectType, obj);
              }
          }
          return objMap;
      }
    // Mute System Permissions for Permission Set Group.
    @AuraEnabled
    public static List<MutingPermissionSet> mutePermissions(String systemPermissionsMapJson,String psgname,String psgapiname,String psgid) {
          Map<String, Object> tempMap = (Map<String, Object>) JSON.deserializeUntyped(systemPermissionsMapJson);
          Map<String, Map<String, Object>> systemPermissionsMap = new Map<String, Map<String, Object>>();
          for (String key : tempMap.keySet()) {
              systemPermissionsMap.put(key, (Map<String, Object>) tempMap.get(key));
          }
          List<MutingPermissionSet> mpsListToInsert = new List<MutingPermissionSet>();
          String mutingId;
          MutingPermissionSet mutingPermissionSet;
          Map<String, Object> permissionsMap = new Map<String, Object>();
          if (systemPermissionsMap.containsKey('')) {
             Map<String,Object> muteResult = mutePermissionsSystemPermissionsMapContains(psgname,psgapiname,systemPermissionsMap,mutingId,psgid);
              mutingId = (String) muteResult.get('mutingId');
              permissionsMap = (Map<String,Object>) muteResult.get('permissionsMap');
              
          } else {
              Map<String,Object> muteResult = mutePermissionsSystemPermissionsMapElse(systemPermissionsMap,mutingId);
              mutingId = (String) muteResult.get('mutingId');
              permissionsMap = (Map<String,Object>) muteResult.get('permissionsMap');
          }
          List<String> validPermissions = mutePermissionsValidFieldPermissions(permissionsMap);
          if (validPermissions.isEmpty()) {
              return mpsListToInsert;
          }
          String fieldsList = 'Id, ' + String.join(validPermissions, ',');
          String query = 'SELECT ' + fieldsList + ' FROM MutingPermissionSet WHERE Id = :mutingId';
          List<MutingPermissionSet> mpsList = Database.query(query);
          if (!mpsList.isEmpty()) {
              mutingPermissionSet = mpsList[0];
              for (String permission : validPermissions) {
                  mutingPermissionSet.put(permission, permissionsMap.get(permission));
              }
              mpsListToInsert.add(mutingPermissionSet);
              try {
                  update mpsListToInsert;
                  return mpsListToInsert;
              } catch (DmlException e) {
                  handleException('Error updating MutingPermissionSet: ', e);
              }
          } else {
              System.debug('No MutingPermissionSet found with Id: ' + mutingId);
          }
          return mpsListToInsert;
      }    
    //Helper Method for mutePermissions
    private static Map<String, Object> mutePermissionsSystemPermissionsMapContains(String psgname,String psgapiname,Map<String, Map<String, Object>> systemPermissionsMap,String mutingId,String psgid){
        Map<String, Object> permissionsMap = new Map<String, Object>();
        MutingPermissionSet mutingPermissionSet = new MutingPermissionSet();
        mutingPermissionSet.MasterLabel = psgname + MUTED_LABEL;
        mutingPermissionSet.DeveloperName = psgapiname + MUTED_DEV_NAME;
        insert mutingPermissionSet;   
        mutingId = mutingPermissionSet.Id;
        PermissionSetGroup psGroup = [SELECT Id FROM PermissionSetGroup WHERE Id = :psgid LIMIT 1];
        PermissionSetGroupComponent component = new PermissionSetGroupComponent(PermissionSetGroupId = psGroup.Id,PermissionSetId = mutingPermissionSet.Id);
        insert component;
        for (String systemId : systemPermissionsMap.keySet()) {
            Map<String, Object> fieldMap = systemPermissionsMap.get(systemId);
            for (String fieldApi : fieldMap.keySet()) {
                Object isChecked = fieldMap.get(fieldApi);
                permissionsMap.put(fieldApi, isChecked);
            }
        }
        return new Map<String,Object>{'mutingId' => mutingId, 'permissionsMap'=> permissionsMap};
    }
    //Heler Method for mute Permissions with not contains
   	 private static Map<String, Object> mutePermissionsSystemPermissionsMapElse(Map<String, Map<String, Object>> systemPermissionsMap, String mutingId){
        Map<String, Object> permissionsMap = new Map<String, Object>();
        for (String systemId : systemPermissionsMap.keySet()) {
            mutingId = systemId;
            Map<String, Object> fieldMap = systemPermissionsMap.get(systemId);
            for (String fieldApi : fieldMap.keySet()) {
                Object isChecked = fieldMap.get(fieldApi);
                permissionsMap.put(fieldApi, isChecked);
            }
        }
        return new Map<String,Object>{'mutingId' => mutingId, 'permissionsMap'=> permissionsMap};
    }
    //Helper Method for mutePermissions for get the valid field permissions.
    private static List<String> mutePermissionsValidFieldPermissions(Map<String, Object> permissionsMap){
        List<String> validPermissions = new List<String>();
        Map<String, Schema.SObjectField> fieldsMap = Schema.SObjectType.MutingPermissionSet.fields.getMap();
        for (String permission : permissionsMap.keySet()) {
            if (fieldsMap.containsKey(permission)) {
                validPermissions.add(permission);
            } else {
                System.debug('Field ' + permission + ' is not available on MutingPermissionSet.');
            }
        }
        return validPermissions;
    }
    //Helper method to get field permissions of group.
    @AuraEnabled
    public static Map<String, List<FieldPermissions>> getFieldPermissionspsg(String persetgrpid) {
          List<FieldPermissions> fieldPermissions = [SELECT SObjectType, Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE Parent.PermissionSetGroupId = :persetgrpid];
          Map<String, List<FieldPermissions>> fieldmap = new Map<String, List<FieldPermissions>>();
          for (FieldPermissions fie : fieldPermissions) {
              if (!fieldmap.containsKey(fie.SObjectType)) {
                  fieldmap.put(fie.SObjectType, new List<FieldPermissions>());
              }
              fieldmap.get(fie.SObjectType).add(fie);
          }
          return fieldmap;
      }  
    //Helper method to get muted field permissions of group.
    @AuraEnabled
    public static Map<String, List<fieldPermissions>> getmutingFieldPermissionspsg(String persetgrpid_toMute) {
          String nullValue = '%_%';
          list<PermissionSetGroupComponent> per = [SELECT id,PermissionSetId,PermissionSet.Name,PermissionSetGroupId,PermissionSetGroup.DeveloperName
                                                   FROM PermissionSetGroupComponent
                                                   WHERE
                                                   PermissionSetGroupId = :persetgrpid_toMute
                                                   AND (NOT PermissionSet.Name LIKE :nullValue)];
          String perSetGrpCmpIds;
          for (PermissionSetGroupComponent pe : per) {
              perSetGrpCmpIds = pe.PermissionSetId;
          }
          List<MutingPermissionSet> mpsList = [SELECT id FROM MutingPermissionSet WHERE id = :perSetGrpCmpIds];
          perSetGrpCmpIds = mpsList[0].Id;        
          List<FieldPermissions> fieldPermissions = [SELECT SObjectType, Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE ParentId = :perSetGrpCmpIds];
          Map<String, List<FieldPermissions>> fieldmap = new Map<String, List<FieldPermissions>>();        
          for (FieldPermissions fie : fieldPermissions) {
              if (!fieldmap.containsKey(fie.SObjectType)) {
                  fieldmap.put(fie.SObjectType, new List<FieldPermissions>());
              }
              fieldmap.get(fie.SObjectType).add(fie);
          }        
          return fieldmap;
     }
    public class MutePermissionUpdateWrapper {
          @AuraEnabled public Map<string, Object> objectPermissions { get; set; }
          @AuraEnabled public List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPermissions { get; set; }
          public MutePermissionUpdateWrapper(Map<string, Object> objectPermissions, List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPermissions) {
              this.objectPermissions = objectPermissions;
              this.fieldPermissions = fieldPermissions;
          }
      }
    //This method is used for updating muting permissions for group.
    @AuraEnabled
    public static MutePermissionUpdateWrapper updateMutePermissions(string mutePermId,string permSetId,string objName,Map<String, Map<String, Boolean>> objPermission,List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPermissionWrapperList) {
          Map<string, Object> objResult = new Map<String, Object>();
          List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldResult = new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>();
          if (objPermission != null) {
              objResult = PermissionSetGroupManager.updateObjPermissions(objPermission,mutePermId);
          }
          if (fieldPermissionWrapperList != null) {
              fieldResult = updateFieldPermissions(fieldPermissionWrapperList,mutePermId,objName,'MutePermissions');
          }
          MutePermissionUpdateWrapper objAndFieldPermResultWrapper = new MutePermissionUpdateWrapper(objResult,fieldResult);
          return objAndFieldPermResultWrapper;
      } 
    //Helper method to update object permissions.
    @AuraEnabled
    public static Map<String, Object> updateObjPermissions(Map<String, Map<String, Object>> objPerms,String permSetId)
    {
         return PermissionAnalyzerObjectServer.updateObjPermissions(objPerms,permSetId);        
    }  
    //Helper method to update field permissions.
    @AuraEnabled
    public static List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> updateFieldPermissions(List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> fieldPermissionWrapperList,String permissionSetId,String objName,String fieldPermType) {
         
        return PermissionAnalyzerObjectServer.updateFieldPermissions(fieldPermissionWrapperList,permissionSetId,objName,fieldPermType);
    }  
    public class PermissionSetGroupObjectDetails {
          @AuraEnabled Public List<EntityDefinition> entityDefList { get; set; }
          @AuraEnabled Public Map<String, Object> objectPermissions { get; set; }
          Public PermissionSetGroupObjectDetails(List<EntityDefinition> entityDefList,Map<string, Object> objectPermissions) {
              this.entityDefList = entityDefList;
              this.objectPermissions = objectPermissions;
          }
      }  
    //This method is used to get object permissions details.
    @AuraEnabled(cacheable=true)
    public static PermissionSetGroupObjectDetails getSobject(String permId) {
          Map<String, Object> objectPermissionsMap = new Map<String, Object>();
          if (permId != null && permId != '') {
              for (ObjectPermissions objPerm : [SELECT Id,SObjectType,PermissionsRead,PermissionsCreate,PermissionsEdit,PermissionsDelete,PermissionsViewAllRecords,PermissionsModifyAllRecords
                                                FROM ObjectPermissions WHERE Parent.PermissionSetGroup.Id = :permId]) 
              {
                  if (objPerm != null) {
                      Map<String, Object> objectPermMap = new Map<String, Object>();
                      objectPermMap.put('PermissionsCreate', objPerm.PermissionsCreate);
                      objectPermMap.put('PermissionsRead', objPerm.PermissionsRead);
                      objectPermMap.put('PermissionsEdit', objPerm.PermissionsEdit);
                      objectPermMap.put('PermissionsDelete', objPerm.PermissionsDelete);
                      objectPermMap.put('PermissionsViewAllRecords',objPerm.PermissionsViewAllRecords);
                      objectPermMap.put('PermissionsModifyAllRecords',objPerm.PermissionsModifyAllRecords);
                      objectPermissionsMap.put(objPerm.SObjectType, objectPermMap);
                  }
              }
          }
          return new PermissionSetGroupObjectDetails([SELECT Id, Label, QualifiedApiName, NameSpacePrefix FROM EntityDefinition WHERE DefaultCompactLayoutId != NULL],objectPermissionsMap); 
      }
    public class PermissionSetGroupObjectPermissionsWrapper {
          @AuraEnabled public List<Map<String, Object>> fieldPermissions { get; set; }
          @AuraEnabled public Boolean hasObjAccess { get; set; }
          @AuraEnabled public List<Object> objDependent { get; set; }
          @AuraEnabled public List<RecordType> recordTypeDetails { get; set; }
          @AuraEnabled public string MutedId { get; set; }
          public PermissionSetGroupObjectPermissionsWrapper(List<Map<String, Object>> fieldPermissions,Boolean hasObjAccess,List<Object> objDependent,List<RecordType> recordTypeDetails,string muteId) {
              this.fieldPermissions = fieldPermissions;
              this.hasObjAccess = hasObjAccess;
              this.objDependent = objDependent;
              this.recordTypeDetails = recordTypeDetails;
              this.MutedId = muteId;
          }
     }
    //This Method Used to retrieve fieldDefinition, valid Sobjects for Obj Permissions, Valid field for field Permissions and also fetch Object Permissons Dependencies
    @AuraEnabled
    public static PermissionSetGroupObjectPermissionsWrapper getSobjectPermissionsForPermissionSetGroup(String permSetId,String objName) {
          Map<String, Boolean> fieldAccess = PermissionSetManager.checkFieldType(objName);
          string nullValue = '%_%';
          list<PermissionSetGroupComponent> per = [SELECT id,PermissionSetId,PermissionSet.Name,PermissionSetGroupId,PermissionSetGroup.DeveloperName FROM PermissionSetGroupComponent
                                                   WHERE
                                                   PermissionSetGroupId = :permSetId
                                                   AND (NOT PermissionSet.Name LIKE :nullValue)
                                                  ];
          string muteId;
          for (PermissionSetGroupComponent pe : per) {
              muteId = pe.PermissionSetId;
          }
          List<MutingPermissionSet> mpsList = [SELECT id FROM MutingPermissionSet WHERE id = :muteId];
          MutingPermissionSet mutingPermissionSet;
          if (!mpsList.isEmpty()) {
              mutingPermissionSet = mpsList[0];
              muteId = mutingPermissionSet.Id;
          }
          List<Map<String, Object>> fieldPermissionsMapList = new List<Map<String, Object>>();
          Map<String, Map<String, Object>> fieldDefMapByName = PermissionSetManager.getFieldDefinitionProfile(objName);
          Map<String, FieldPermissions> fieldPermissionsMap = new Map<String, FieldPermissions>();
          for (FieldPermissions fieldPerm : [SELECT SObjectType, Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE Parent.PermissionSetGroup.Id = :permSetId AND SObjectType = :objName]) {
              if (fieldPerm != null) {
                  fieldPermissionsMap.put(fieldPerm.Field, fieldPerm);
              }
          }
          for (String fieldKey : fieldDefMapByName.keySet()) {    
              if (fieldKey != null && (Boolean) fieldDefMapByName.get(fieldKey).get('isPermissionable') && fieldAccess.get(fieldKey) == true) {
                  Map<String, Object> fieldPermissionMap = new Map<String, Object>();
                  fieldPermissionMap.put('Field', fieldKey);
                  fieldPermissionMap.put('label',fieldDefMapByName.get(fieldKey).get('Label'));
                  if (fieldPermissionsMap.containsKey(fieldKey)) {
                      FieldPermissions fieldPerm = fieldPermissionsMap.get(fieldKey);
                      fieldPermissionMap.put('PermissionsRead',fieldPerm.PermissionsRead);
                      fieldPermissionMap.put('PermissionsEdit',fieldPerm.PermissionsEdit);
                  } else {
                      fieldPermissionMap.put('PermissionsRead', false);
                      fieldPermissionMap.put('PermissionsEdit', false);
                  }
                  fieldPermissionMap.put('hasEditAccess',fieldDefMapByName.get(fieldKey).get('isCalculated'));
                  fieldPermissionsMapList.add(fieldPermissionMap);
              }
          }
          List<RecordType> recordTypeDetails = [SELECT Id, Name, DeveloperName, NamespacePrefix FROM RecordType WHERE SobjectType = :objName ORDER BY Name ASC];  
          return new PermissionSetGroupObjectPermissionsWrapper(fieldPermissionsMapList,PermissionSetManager.checkSObjType(objName),PermissionAnalyzerObjectServer.checkObjectPermissionDependencies(objName),
                                                                recordTypeDetails,
                                                                muteId
                                                               );
      }    
    public class MutePermissionWrapper {
          @AuraEnabled public String mutePermSetId { get; set; }
          @AuraEnabled public SObjectPermissionWrapper wrapper { get; set; }
          
          public MutePermissionWrapper(String mutePermSetId,SObjectPermissionWrapper wrapper) {
              this.mutePermSetId = mutePermSetId;
              this.wrapper = wrapper;
          }
      }
    public class SObjectPermissionWrapper {
          @AuraEnabled public Map<String, Object> objectPermissions;
          @AuraEnabled public Map<String, Object> fieldPermissions;
          public SObjectPermissionWrapper(Map<String, Object> objectPermissions,Map<String, Object> fieldPermissions) {
              this.objectPermissions = objectPermissions != null ? objectPermissions : new Map<String, Object>();
              this.fieldPermissions = fieldPermissions != null ? fieldPermissions : new Map<String, Object>();
          }
          public SObjectPermissionWrapper() {
              this.objectPermissions = new Map<string, Object>();
              this.fieldPermissions = new Map<string, Object>();
          }
      }  
    //This method is used to retrieve object & field permissions.
    @AuraEnabled
    public static SObjectPermissionWrapper objAndFieldPermHelper(String permSetId,List<String> objNames,String objName) {
          Map<String, Object> permissionSetMap = new Map<String, Object>();
          Map<String, Object> fieldPermissionsMap = new Map<String, Object>();
          if (permSetId != null) {
              for (objectPermissions objPerm : [SELECT Id,SObjectType,PermissionsCreate,PermissionsEdit,PermissionsRead,PermissionsDelete,PermissionsModifyAllRecords,
                                                PermissionsViewAllRecords
                                                FROM ObjectPermissions
                                                WHERE parentId = :permSetId AND SObjectType IN :objNames
                                               ]) {
                                                   if (objPerm != null) {
                                                       Map<String, Object> objectPermMap = new Map<String, Object>();
                                                       objectPermMap.put('SObjectType', objPerm.SObjectType);
                                                       objectPermMap.put('PermissionsRead', objPerm.PermissionsRead);
                                                       objectPermMap.put('PermissionsCreate', objPerm.PermissionsCreate);
                                                       objectPermMap.put('PermissionsEdit', objPerm.PermissionsEdit);
                                                       objectPermMap.put('PermissionsDelete', objPerm.PermissionsDelete);
                                                       objectPermMap.put('PermissionsViewAllRecords',objPerm.PermissionsViewAllRecords);
                                                       objectPermMap.put('PermissionsModifyAllRecords',objPerm.PermissionsModifyAllRecords);
                                                       permissionSetMap.put(objPerm.SObjectType, objectPermMap);
                                                   }
                                               }
              for (FieldPermissions fieldPerm : [SELECT Id, Field, PermissionsRead, PermissionsEdit, SObjectType FROM FieldPermissions
                                                 WHERE ParentId = :permSetId AND SObjectType = :objName
                                                ]) {
                                                    if (fieldPerm != null) {
                                                        Map<String, Object> fieldPermission = new Map<String, Object>();
                                                        fieldPermission.put('PermissionsRead', fieldPerm.PermissionsRead);
                                                        fieldPermission.put('PermissionsEdit', fieldPerm.PermissionsEdit);
                                                        fieldPermission.put('Field', fieldPerm.Field);
                                                        fieldPermissionsMap.put(fieldPerm.Field, fieldPermission);
                                                    }
                                                }
          }
          return new SObjectPermissionWrapper(permissionSetMap, fieldPermissionsMap);
      }
    //This method is used to retrieve muted object and field permissions.
    @AuraEnabled
    public static MutePermissionWrapper getMutedObjandFieldPermissions(String groupId,List<String> objNames,String objName) {
          String permSetId;
          if (groupId != null) {
              List<PermissionSetGroupComponent> psgg = [SELECT Id,PermissionSetGroup.DeveloperName,PermissionSetGroup.MasterLabel,PermissionSetId FROM PermissionSetGroupComponent
                                                        WHERE
                                                        PermissionSetGroupId = :groupId
                                                        AND (NOT PermissionSet.Name LIKE '%_%')
                                                       ];
              if (!psgg.isEmpty()) {
                  permSetId = psgg[0].PermissionSetId;
              }
              if (psgg.isEmpty()) {
                  PermissionSetGroup permSetGrp = [SELECT Id, MasterLabel, DeveloperName FROM PermissionSetGroup WHERE Id = :groupId LIMIT 1];
                  if (permSetGrp != null) {
                      MutingPermissionSet mutePerm = new MutingPermissionSet();
                      mutePerm.MasterLabel = permSetGrp.MasterLabel + MUTED_LABEL;
                      mutePerm.DeveloperName = permSetGrp.DeveloperName + MUTED_DEV_NAME;
                      insert mutePerm;
                      permSetId = mutePerm.Id;
                      PermissionSetGroupComponent component = new PermissionSetGroupComponent(PermissionSetGroupId = permSetGrp.Id,PermissionSetId = permSetId);
                      insert component;
                  } else {
                      System.debug('PermissionSetGroup not found for Id: ' + groupId);
                  }
              }
          }
          SObjectPermissionWrapper objAndFieldPermWrapper = objAndFieldPermHelper(permSetId,objNames,objName);
          return new MutePermissionWrapper(permSetId, objAndFieldPermWrapper);
      }
    //Helper method to capture Exception logs.
    private static void handleException(String message, Exception e) {
          String fullMessage = e == null ? message : message + ': ' + e.getMessage();
          System.debug(LoggingLevel.ERROR, fullMessage);
          throw new AuraHandledException(fullMessage);
      }
    
  }