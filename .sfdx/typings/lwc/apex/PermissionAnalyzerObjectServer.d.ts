declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getObjectRelatedDetails" {
  export default function getObjectRelatedDetails(param: {sObjectNameList: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getFieldsRelatedDetails" {
  export default function getFieldsRelatedDetails(param: {sObjectNameList: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.checkSobjectFoundInPicklist" {
  export default function checkSobjectFoundInPicklist(param: {sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.checkFieldFoundInPicklist" {
  export default function checkFieldFoundInPicklist(param: {sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.checkObjectPermissionDependencies" {
  export default function checkObjectPermissionDependencies(param: {objName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getObjPermissionsForMutingPermSet" {
  export default function getObjPermissionsForMutingPermSet(param: {groupId: any, objNames: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getFieldPermissionsForMutingPermSet" {
  export default function getFieldPermissionsForMutingPermSet(param: {groupId: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getSelectePermissionsetObjResult" {
  export default function getSelectePermissionsetObjResult(param: {permSetId: any, objNames: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.getSelectePermissionSetFieldResult" {
  export default function getSelectePermissionSetFieldResult(param: {permSetId: any, fieldMap: any, fieldsList: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.updateObjPermissions" {
  export default function updateObjPermissions(param: {objPerms: any, permSetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerObjectServer.updateFieldPermissions" {
  export default function updateFieldPermissions(param: {fieldPermissionWrapperList: any, permissionSetId: any, objName: any, fieldPermType: any}): Promise<any>;
}
