declare module "@salesforce/apex/PermissionAnalyzerRecordTypeServer.getRecTypeVisibilityForProfileAndPermSet" {
  export default function getRecTypeVisibilityForProfileAndPermSet(param: {objName: any, permissionSetId: any, profileOrPermissionSetType: any, profileOrPermSetName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerRecordTypeServer.getRecordTypeVisibilityForProfile" {
  export default function getRecordTypeVisibilityForProfile(param: {profileNames: any, sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerRecordTypeServer.getRecordTypeVisibilityForPermSet" {
  export default function getRecordTypeVisibilityForPermSet(param: {permissionsSetNames: any, sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerRecordTypeServer.updateRecordTypeVisibility" {
  export default function updateRecordTypeVisibility(param: {recordTypeVisibility: any, profileOrPermSetNames: any, profileOrPermissionSetType: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerRecordTypeServer.updateRecordTypeVisibilityForPermSet" {
  export default function updateRecordTypeVisibilityForPermSet(param: {permissionSetNames: any, recordTypeUpdates: any}): Promise<any>;
}
