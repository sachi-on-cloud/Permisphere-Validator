declare module "@salesforce/apex/ManageCloneUser.getUsers" {
  export default function getUsers(): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getUserAssignedGroups" {
  export default function getUserAssignedGroups(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.assignPermissionsAndGroups" {
  export default function assignPermissionsAndGroups(param: {userId: any, permissionSetIds: any, publicGroupIds: any, queueIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.assignPermissionSets" {
  export default function assignPermissionSets(param: {userId: any, permissionSetIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.assignPublicGroups" {
  export default function assignPublicGroups(param: {userId: any, publicGroupIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.assignQueues" {
  export default function assignQueues(param: {userId: any, queueIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getAllUsers" {
  export default function getAllUsers(): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.userActivation" {
  export default function userActivation(param: {userId: any, isActive: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getPermissionSetsByUserLicense" {
  export default function getPermissionSetsByUserLicense(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getAssignedAssignment" {
  export default function getAssignedAssignment(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getConnectedAssignment" {
  export default function getConnectedAssignment(param: {connectedAppId: any}): Promise<any>;
}
declare module "@salesforce/apex/ManageCloneUser.getConnectedAppId" {
  export default function getConnectedAppId(): Promise<any>;
}
