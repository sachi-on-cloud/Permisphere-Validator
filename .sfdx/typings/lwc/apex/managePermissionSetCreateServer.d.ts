declare module "@salesforce/apex/ManagePermissionSetCreateServer.duplicatePermissionSetCheck" {
  export default function duplicatePermissionSetCheck(param: {label: any, apiName: any}): Promise<any>;
}
declare module "@salesforce/apex/ManagePermissionSetCreateServer.getUserLicenseForUser" {
  export default function getUserLicenseForUser(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/ManagePermissionSetCreateServer.getUsersBasedOnLicenseName" {
  export default function getUsersBasedOnLicenseName(param: {licenseName: any}): Promise<any>;
}
declare module "@salesforce/apex/ManagePermissionSetCreateServer.createNewPermissionSet" {
  export default function createNewPermissionSet(param: {newPermSet: any, userIds: any, objectPermissionsMap: any, fieldPerms: any, objName: any, updateType: any, tabToUpdate: any, userToUpdate: any, recTypeToUpdate: any}): Promise<any>;
}
declare module "@salesforce/apex/ManagePermissionSetCreateServer.createPermissionSetWithTabsAndUsers" {
  export default function createPermissionSetWithTabsAndUsers(param: {permSetToCreate: any, tabSettingsJson: any, userids: any}): Promise<any>;
}
