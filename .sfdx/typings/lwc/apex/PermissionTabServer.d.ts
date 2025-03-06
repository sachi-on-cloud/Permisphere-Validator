declare module "@salesforce/apex/PermissionTabServer.getUserDefinitions" {
  export default function getUserDefinitions(): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getObjectDefinition" {
  export default function getObjectDefinition(): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getFieldDefinition" {
  export default function getFieldDefinition(param: {objectName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getPermsandUsersOfSelectedPerms" {
  export default function getPermsandUsersOfSelectedPerms(param: {userPermissions: any, objName: any, objPermission: any, objFieldName: any, fieldName: any, fieldPerm: any, perSetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getObjOrFieldPerm" {
  export default function getObjOrFieldPerm(param: {objName: any, permType: any, fieldName: any, userId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getObjOrFieldPermissionsOrigin" {
  export default function getObjOrFieldPermissionsOrigin(param: {permissionType: any, permSetIds: any, objName: any, fieldName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionTabServer.getUserPerm" {
  export default function getUserPerm(param: {userId: any, perms: any}): Promise<any>;
}
