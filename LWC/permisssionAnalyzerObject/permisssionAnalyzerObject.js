//This Component is used to handle User Permissions for Profile PermissionSet and PermissionSetGroup
//This Component is used as child Component under PermissionAnalyzer
import {LightningElement, api, track} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getObjectRelatedDetails from '@salesforce/apex/PermissionAnalyzerObjectServer.getObjectRelatedDetails';
import updateObjPermissions from '@salesforce/apex/PermissionAnalyzerObjectServer.updateObjPermissions';
import getObjOrFieldPermissionsOrigin from '@salesforce/apex/PermissionTabServer.getObjOrFieldPermissionsOrigin';
import getSelectePermissionsetObjResult from '@salesforce/apex/PermissionAnalyzerObjectServer.getSelectePermissionsetObjResult';
import getObjPermissionsForMutingPermSet from '@salesforce/apex/PermissionAnalyzerObjectServer.getObjPermissionsForMutingPermSet';
import { debounce } from 'c/utils';

export default class PermissionAnalyzerObject extends LightningElement {
    @api metadataPermission
    @api enableObjPermissions;
    @api profileNames = '';
    @api enableDefaultProfile;
    @api enableRecordTypePermissions;
    @api enableGrpMutePermissions;
    @api permSetGrpId;
    @api enableHelpTextIcon;
    @api permApiName
    @api type;
    @track selectedObjectType = 'Standard';
    @api permissionSetIdToUpdate;
    permissionSetIds = [];
    permSetList = [];
    @track searchKey = '';
    @track objectDependencies = [];
    @track objectDependenciesCache = {}
    mutedPermId;
    dataSetObject;
    @track muteObjDepPermissions = {};
    showSpinner = false;
    isShowObjectSpinner = false;
    showPopOver = false;
    @track hasObjects = true;    
    isObjEditMode = false;
    isObjEditDisabled = true;
    isObjMuteEditDisabled = true;
    disableCreatePermSet = true;
    @api userId;
    isMuteMode = false
    @track enableObjEditAccess = false;
    @track enableObjEditAccessCache = {};
    objDepPermissions = {};
    @track objPermissions = {
        PermissionsCreate: false,
        PermissionsRead: false,
        PermissionsEdit: false,
        PermissionsDelete: false,
        PermissionsViewAllRecords: false,
        PermissionsModifyAllRecords: false,
    };
    @track muteobjPermission = {
        PermissionsCreate: false,
        PermissionsRead: false,
        PermissionsEdit: false,
        PermissionsDelete: false,
        PermissionsViewAllRecords: false,
        PermissionsModifyAllRecords: false,
    }
    isSaveDisabled = true;    
    changeObjMutePermissions = {};
    changedObjPermissions = {};
    updatedPermissions = {}    
    muteObjPermCache = {}
    lastSavedMutePerm = {};
    lastSavedObjPerm = {};
    @track objectListEntity = [];
    @track objList = []
    profileName;
    permSetName;
    permSetGrpName;
    isProfile = false;
    isPermSet = false;
    isPermSetGrp = false;
    isExistingPermission = false;
    isCreateNewPermissionSet = false
    @api profName;
    isPersetgrpAffect = false;
    isPersetAffectObject = false;
    isPersetgrpAffectObject = false;
    @api persetName;
    @api typeValue;
    isModalOpen = false;
    isProfileAffect = false;
    isPermissionSetAffect = false;
    isProfileAffectObject = false;
    isPermissionSetAffectObject = false;
    isPermissionSetGroupAffect = false;
    isPermissionSetGroupAffectObject = false;
    isProfileAffectHeading = false;
    isPermissionSetAffectHeading = false;
    isPermissionSetGroupAffectHeading = false;
    @track sortBy;
    @track sortDirection;
    isUsersTable = false;
    @api userValue
    @api userValueLength;
    showUsers = true;
    truncatedArrayString;
    fieldPermissionsCache = {};
    recordTypeCache={};
    // Cache management
    @track permissionCache = new Map();
    @track searchCache = new Map();
    
    // Debounced search handler
    handleSearchKeyChange = debounce((event) => {
        const searchTerm = event.target.value.toLowerCase();
        this.filterObjects(searchTerm);
    }, 300);

    // Memoized permission filtering
    filterObjects(searchTerm) {
        const cacheKey = searchTerm;
        if (this.searchCache.has(cacheKey)) {
            this.filteredObjList = this.searchCache.get(cacheKey);
            return;
        }

        const filtered = this.objectListEntity.filter(obj => 
            obj.label.toLowerCase().includes(searchTerm)
        );

        this.searchCache.set(cacheKey, filtered);
        this.filteredObjList = filtered;
        this.hasObjects = filtered.length > 0;
    }

    // Batch processing for permissions
    processPermissionsBatch(permissions, batchSize = 50) {
        let processed = 0;
        const total = permissions.length;

        const processBatch = () => {
            const batch = permissions.slice(processed, processed + batchSize);
            batch.forEach(this.processPermission);
            processed += batch.length;

            if (processed < total) {
                requestAnimationFrame(processBatch);
            }
        };

        requestAnimationFrame(processBatch);
    }

    // Error boundary implementation
    @api
    handleError(error) {
        console.error('Permission Analyzer Object Error:', error);
        this.showErrorToast(error);
        this.resetState();
    }

    // Performance monitoring
    measurePerformance(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }

    // Lifecycle hooks optimization
    disconnectedCallback() {
        this.clearCaches();
        this.unsubscribeFromEvents();
    }

    // Clear caches
    clearCaches() {
        this.permissionCache.clear();
        this.searchCache.clear();
    }

    //Getter Setter Method to get Object EntityDefinition from Parent
    @api
    get objectList() {
        return this.objectListEntity;
    }
    set objectList(value) {
        this.objectListEntity = JSON.parse(JSON.stringify(value));
        this.objList = this.objectListEntity;
        this.handleClearValues()
    }
    //Getter Setter Method to get PermissionSetId of Users from Parent
    @api
    get permissionSetid() {
        return this.permissionSetIds;
    }
    set permissionSetid(value) {
        this.permissionSetIds = JSON.parse(JSON.stringify(value));
    }
    //Getter Setter Method to get PermissionSet of Users from Parent
    @api
    get permSetLists() {
        return this.permSetList;
    }
    set permSetLists(value) {
        this.permSetList = JSON.parse(JSON.stringify(value));
    }

    previousTemplateState = {
        isProfileAffect: false,
        isPermissionSetAffect: false,
        isProfileAffectObject: false,
        isPermissionSetAffectObject: false,
        isPermissionSetGroupAffect: false,
        isPermissionSetGroupAffectObject: false,
    };

    userColumn = [{
            label: 'Full Name',
            fieldName: 'Name',
            sortable: true
        },
        {
            label: 'User Name',
            fieldName: 'Username',
            sortable: true
        },
        {
            label: 'Is Active',
            fieldName: 'isActive',
            sortable: true
        },
        {
            label: 'User License',
            fieldName: 'licenseName',
            sortable: true
        },
    ];
    datacolumns = [{
            label: 'FIELD LEVEL PERMISSIONS',
            fieldName: 'label',
        },
        {
            label: 'Read Access',
            fieldName: 'PermissionsRead',
        },
        {
            label: 'Edit Access',
            fieldName: 'PermissionsEdit',
        }

    ]
    //This ConnectedCallBack method is used to store the Object permissions in separate variable which got from parent
    connectedCallback() {
        Object.keys(this.metadataPermission).forEach(key => {
            this.objDepPermissions[key] = this.metadataPermission[key].objectPermissions
        })
    }
   
    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //Helper method for sorting data
    sortData(fieldName, sortDirection) {
        let data1 = JSON.parse(JSON.stringify(this.userValue));
        let keyValue = (a) => a[fieldName];
        let isReverse = sortDirection === 'asc' ? 1 : -1;

        data1.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.userValue = data1;
    }
    //This Method is used to clear the search object input
    handleClearValues() {
        this.searchKey = '';
        this.hasObjects = true;
    }
    //This getter funtion we handled search Objects in UI level.
    get filteredObjList() {
        if (this.searchKey) {
            return this.objList.filter(obj => obj.label.toLowerCase().includes(this.searchKey.toLowerCase()));
        }
        return this.objList;
    }
    
    //This Method is used to change Object Type Whether Native/Managed
    handleObjectTypeChange(event) {
        this.selectedObjectType = event.detail.value;
        if (this.isStandardObjectSelected) {
            this.standardObjList = this.standardObject;
        } else if (this.isCustomObjectSelected) {
            this.customObjList = this.customObject;
        }
    }
    //This Helper Methos is used to handle Object permissions to edit and object dependency from server
    getObjectHelper(objName) {
        this.objPermissions = {
            PermissionsCreate: false,
            PermissionsRead: false,
            PermissionsEdit: false,
            PermissionsDelete: false,
            PermissionsViewAllRecords: false,
            PermissionsModifyAllRecords: false
        };
        this.muteobjPermission = {
            PermissionsCreate: false,
            PermissionsRead: false,
            PermissionsEdit: false,
            PermissionsDelete: false,
            PermissionsViewAllRecords: false,
            PermissionsModifyAllRecords: false
        };
        getObjectRelatedDetails({sObjectNameList: objName})
        .then(res=>{
            console.log('check object result : ',res);
            this.enableObjEditAccess = res.hasObjAccess && this.profileNames != 'Standard' ? true : false;
            this.enableObjEditAccessCache[objName] = this.enableObjEditAccess
            this.isShowObjectSpinner = false;
            this.objectDependencies = res.dependentObj
            this.objectDependenciesCache[objName] = JSON.parse(JSON.stringify(this.objectDependencies))                
                this.objPermissions = this.objDepPermissions &&
                this.objDepPermissions[objName] &&
                Object.keys(this.objDepPermissions[objName]).length > 0 ?
                JSON.parse(JSON.stringify(this.objDepPermissions[objName])) : {
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsRead: false,
                    PermissionsDelete: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllRecords: false
                };
            this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));  
            const uniqueObjects = new Set();
                this.objectDependencies.forEach(({
                    Permission,
                    RequiredPermission
                }) => {
                    const [objName] = Permission.split('<');
                    const [reqObjName] = RequiredPermission.split('<');
                    uniqueObjects.add(objName);
                    uniqueObjects.add(reqObjName);

                })
                const uniqueObjectArray = Array.from(uniqueObjects);  
                if (this.permSetGrpId != '' && this.permSetGrpId != null) {
                    console.log('Inside mute : ');
                    this.isShowObjectSpinner = true
                    this.mutePermissionsHelper(this.permSetGrpId, uniqueObjectArray, this.dataSetObject);
                }   
        })
    }
    //This Method id used to Manage the Custom Accordian UI
    toggleAccordion(event) {
        this.dataSetObject = event.currentTarget.dataset.name;
        const clickedObj = this.objList.find(item => item.value === this.dataSetObject);
        this.objList = this.objList.map(item => {
            if (item.value === this.dataSetObject) {
                const isCurrentlyOpen = item.isOpen;
                return {
                    ...item,
                    isOpen: !isCurrentlyOpen,
                    icon: !isCurrentlyOpen ? 'utility:chevrondown' : 'utility:chevronright',
                    cursorClass: 'cursor-pointer'
                };
            } else {
                return {
                    ...item,
                    isOpen: false,
                    icon: 'utility:chevronright',
                    cursorClass: 'cursor-pointer'
                };
            }
        });
        if (!clickedObj.isOpen) {
            this.fieldPermissions = [];
            this.isMuteMode = false;
            this.isObjEditMode = false;
            this.isObjEditDisabled = true;
            this.isObjMuteEditDisabled = true;
            this.isShowObjectSpinner = true;
            this.isShowFieldSpinner = true;
            this.isProfile = false;
            this.isPermSet = false;
            this.isPermSetGrp = false;
            this.permSetName = [];
            this.profileName = [];
            this.permSetGrpName = [];
            this.changedFieldPermissions = [];
            this.changedObjPermissions = {};
            this.enableCreatePermSet = false
            this.updatedPermissions = {};
            this.affectedSobject = [];
            this.hasFields = true;
            this.isSaveDisabled = true;
            this.enableObjEditAccess = false;
            console.log('outside toggle if : ',);
            if(this.enableObjEditAccessCache[this.dataSetObject]){
                console.log('inside toggle if : ');
                this.enableObjEditAccess = this.enableObjEditAccessCache[this.dataSetObject];
                this.objectDependencies = JSON.parse(JSON.stringify(this.objectDependenciesCache[this.dataSetObject]));
                this.objPermissions = this.objDepPermissions && this.objDepPermissions[this.dataSetObject] &&
                    Object.keys(this.objDepPermissions[this.dataSetObject]).length > 0 ? JSON.parse(JSON.stringify(this.objDepPermissions[this.dataSetObject])) :
                    {
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsRead: false,
                        PermissionsModifyAllRecords: false,
                        PermissionsViewAllRecords: false
                    };
                    this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));
                    this.isShowObjectSpinner = false;
                    if (this.permSetGrpId != '' && this.permSetGrpId != null) {
                        this.muteObjDepPermissions = JSON.parse(JSON.stringify(this.muteObjPermCache));
                        this.muteobjPermission = JSON.parse(JSON.stringify(this.muteObjPermCache[this.dataSetObject]));
                        this.lastSavedMutePerm = JSON.parse(JSON.stringify(this.muteobjPermission));
                    }   
            }
            else {
                this.getObjectHelper(this.dataSetObject);               
            }
        }
    }
    //This Method is used to Initiate Object Edit
    handleObjEdit() {
        this.isObjEditMode = true;
        if (this.profileNames == 'Standard') {
            this.isObjEditDisabled = true;
        } else {
            this.isObjEditDisabled = this.enableObjEditAccess ? false : true;
        }        
    }
    //This Method is used to cancel and revert back the changes based on respective cancel buttons
    handleCancel(event) {
        console.log('event.currentTarget >> ', event.currentTarget.name);
        if (event.currentTarget.name == 'obj cancel') {
            this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
            this.changedObjPermissions = {};
            this.disableCreatePermSet = false
            this.updatedPermissions = {}
            this.affectedSobject = [];
            this.isObjEditMode = false;
            this.isObjEditDisabled = true;
            this.isSaveDisabled = true;
        }
        if (event.currentTarget.name == 'mute cancel') {
            this.isMuteMode = false;
            this.isObjMuteEditDisabled = true;
            this.muteobjPermission = JSON.parse(JSON.stringify(this.lastSavedMutePerm));
            this.changeObjMutePermissions = {};
            this.affectedSobject = [];
            this.isSaveDisabled = true;
        }
        if (event.currentTarget.name == 'profile cancel') {
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectObject = false;
            this.isPermissionSetAffectObject = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectObject = false;
            this.isModalOpen = false;
            this.updatedPermissions = {};
        }
        if (event.currentTarget.name == 'user cancel') {
            this.isUsersTable = false;
            this.isProfileAffect = this.previousTemplateState.isProfileAffect;
            this.isProfileAffectObject = this.previousTemplateState.isProfileAffectObject;
            this.isPermissionSetAffect = this.previousTemplateState.isPermissionSetAffect;
            this.isPermissionSetAffectObject = this.previousTemplateState.isPermissionSetAffectObject;
            this.isPermissionSetGroupAffect = this.previousTemplateState.isPermissionSetGroupAffect;
            this.isPermissionSetGroupAffectObject = this.previousTemplateState.isPermissionSetGroupAffectObject;
            this.previousTemplateState = {};
            this.isModalOpen = true;
        }
        if (event.currentTarget.name == 'persetgrp cancel') {
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectObject = false;
            this.isPermissionSetAffectObject = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectObject = false;
            this.isModalOpen = false;
            this.updatedPermissions = {};
        }
        if (event.currentTarget.name == 'profile affect cancel') {
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectObject = false;
            this.isPermissionSetAffectObject = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectObject = false;
            this.isModalOpen = false;
            this.updatedPermissions = {};
        }
        if (event.currentTarget.name == 'persetgrp affect object cancel') {
            this.muteobjPermission = JSON.parse(JSON.stringify(this.lastSavedMutePerm));
            this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPermissions));
            this.isObjMuteEditDisabled = true;
            this.isMuteMode = false;
            this.changedFieldPermissions = [];
            this.changeObjMutePermissions = {}
            this.affectedSobject = []
            this.isSaveDisabled = true
            this.isPermissionSetGroupAffectObject = false;
            this.isModalOpen = false;
        }
        if (event.currentTarget.name === 'Existing PermissionSet cancel') {
            this.isExistingPermission = false;
        }
    }
    //This Method is used to Cancel user PopUp
    handleUserCancel() {
        this.isUsersTable = false;
        this.isModalOpen = true;
    }
    //This Method is used to handle the Object Permission Change for Profile and PermissionSet
    handlePermissionChange(event) {
        this.isSaveDisabled = false;
        let {
            name,
            checked
        } = event.target;
        switch (name) {
            case 'create':
                this.objPermissions.PermissionsCreate = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                break;
            case 'edit':
                this.objPermissions.PermissionsEdit = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                if (!checked) {
                    this.objPermissions.PermissionsDelete = false;
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;
            case 'read':
                this.objPermissions.PermissionsRead = checked;
                if (!checked) {
                    this.objPermissions.PermissionsCreate = false;
                    this.objPermissions.PermissionsEdit = false;
                    this.objPermissions.PermissionsDelete = false;
                    this.objPermissions.PermissionsViewAllRecords = false;
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;
            case 'delete':
                this.objPermissions.PermissionsDelete = checked;
                if (checked) {
                    if (!this.objPermissions.PermissionsRead) {
                        this.objPermissions.PermissionsRead = true;
                    }
                    if (!this.objPermissions.PermissionsEdit) {
                        this.objPermissions.PermissionsEdit = true;
                    }
                }
                if (!checked) {
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;
            case 'viewAllRecords':
                this.objPermissions.PermissionsViewAllRecords = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                if (!checked) {
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;
            case 'modifyAllRecords':
                this.objPermissions.PermissionsModifyAllRecords = checked;
                if (checked) {
                    if (!this.objPermissions.PermissionsRead) {
                        this.objPermissions.PermissionsRead = true;
                    }
                    if (!this.objPermissions.PermissionsEdit) {
                        this.objPermissions.PermissionsEdit = true;
                    }
                    if (!this.objPermissions.PermissionsDelete) {
                        this.objPermissions.PermissionsDelete = true;
                    }
                    if (!this.objPermissions.PermissionsViewAllRecords) {
                        this.objPermissions.PermissionsViewAllRecords = true;
                    }
                }
                break;
            default:
        }
        this.changedObjPermissions[this.dataSetObject] = {
            ...this.objPermissions
        };
        if (this.objectDependencies.length > 0) {
            this.handleDependencies(name, checked);
        }
        console.log('Changed permissions::::::', JSON.stringify(this.changedObjPermissions));
    }
    //This is Helper method to take care of Object to Object Dependencies for Profile and permissionSet
    handleDependencies(changedPermission, isChecked) {
        const relatedPermissionsCheckMap = {
            read: ['read'],
            edit: ['read', 'edit'],
            delete: ['read', 'edit', 'delete'],
            create: ['read', 'create'],
            viewAllRecords: ['read', 'viewAllRecords'],
            modifyAllRecords: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords']
        };
        const relatedPermissionsUncheckMap = {
            read: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords', 'create'],
            edit: ['edit', 'delete', 'modifyAllRecords'],
            delete: ['delete', 'modifyAllRecords'],
            create: ['create'],
            viewAllRecords: ['viewAllRecords', 'modifyAllRecords'],
            modifyAllRecords: ['modifyAllRecords']
        };
        const allRelatedPerm = ['read', 'create', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords'];

        let objDependentPerm = JSON.parse(JSON.stringify(this.objDepPermissions));
        console.log('Object Dependent Perms to clone :: ', JSON.stringify(this.objDepPermissions));
        console.log('New Object Dependent Perm :: ', JSON.stringify(objDependentPerm));

        const affectedPermissions = [];
        let processedObjects = {}
        try {
            this.objectDependencies.forEach(({
                Permission,
                RequiredPermission
            }) => {
                const [objName, permType] = Permission.split('<');
                const [reqObjName, reqPermType] = RequiredPermission.split('<');
                const checkAndSetParentPermissions = (objectName, permissionType, isChecked) => {
                    if (!objDependentPerm[objectName]) {
                        objDependentPerm[objectName] = {
                            PermissionsRead: false,
                            PermissionsEdit: false,
                            PermissionsDelete: false,
                            PermissionsCreate: false,
                            PermissionsViewAllRecords: false,
                            PermissionsModifyAllRecords: false,
                        };
                    }
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (!objDependentPerm[objectName][valueKey] && isChecked) {
                        objDependentPerm[objectName][valueKey] = true;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        if (!this.objDepPermissions[objectName] || !this.objDepPermissions[objectName][valueKey]) {
                            this.changedObjPermissions[objectName] = objDependentPerm[objectName];
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${objectName}<${permissionType}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            checkAndSetParentPermissions(parentObjName, permissionType, isChecked);
                        }
                    });
                };
                const uncheckAndSetChildPermissions = (objectName, permissionType) => {
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (objDependentPerm[objectName] && objDependentPerm[objectName][valueKey]) {
                        objDependentPerm[objectName][valueKey] = false;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        this.changedObjPermissions[objectName] = objDependentPerm[objectName];
                        this.objectDependencies.forEach(dep => {
                            if (dep.RequiredPermission === `${objectName}<${permissionType}>`) {
                                const [childObjName, childPermType] = dep.Permission.split('<');
                                relatedPermissionsUncheckMap[permissionType].forEach(relatedPerm => {
                                    uncheckAndSetChildPermissions(childObjName, relatedPerm);
                                });
                            }
                        });
                    }
                };

                const checkRevertingPermissions = (objectName, reqObjectName, relatedPerm) => {
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    const depPermissionValue = this.objDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    processedObjects[objectName] = processedObjects[objectName] ? processedObjects[objectName] : {
                        ...depPermissionValue
                    }
                    if (this.changedObjPermissions[reqObjectName][valueKey] === this.objDepPermissions[reqObjectName][valueKey]) {
                        this.changedObjPermissions[objectName] = processedObjects[objectName];
                    } else {
                        this.changedObjPermissions[objectName][valueKey] = this.changedObjPermissions[reqObjectName][valueKey];
                        if (!this.changedObjPermissions[objectName][valueKey]) {
                            relatedPermissionsUncheckMap[relatedPerm].forEach(depPerm => {
                                const depValueKey = `Permissions${depPerm.charAt(0).toUpperCase() + depPerm.slice(1)}`;
                                this.changedObjPermissions[objectName][depValueKey] = false;
                                processedObjects[objectName][depValueKey] = this.changedObjPermissions[objectName][depValueKey];
                            });
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (this.changedObjPermissions[childObjName]) {
                                checkRevertingPermissions(childObjName, objectName, relatedPerm);
                            }
                        }
                    })
                }
                const uncheckRevertingPermissions = (requiredObjectName, objectName, relatedPerm) => {
                    const depPermissionValue = this.objDepPermissions[requiredObjectName] ? this.objDepPermissions[requiredObjectName] : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.objDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    if (this.changedObjPermissions[objectName][valueKey] === reqPermission[valueKey]) {
                        this.changedObjPermissions[requiredObjectName][valueKey] = depPermissionValue[valueKey];
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${requiredObjectName}<${relatedPerm}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            if (this.changedObjPermissions[parentObjName]) {
                                uncheckRevertingPermissions(parentObjName, requiredObjectName, relatedPerm);
                            }
                        }
                    })
                }
                if (isChecked && objName === this.dataSetObject) {
                    if (relatedPermissionsCheckMap[changedPermission]) {
                        relatedPermissionsCheckMap[changedPermission].forEach(relatedPerm => {
                            if (RequiredPermission.includes(`${reqObjName}<${relatedPerm}>`)) {
                                checkAndSetParentPermissions(reqObjName, relatedPerm, isChecked);
                            }
                        });
                    }
                }
                if (isChecked && reqObjName === this.dataSetObject && this.changedObjPermissions[objName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        const permissionKey = `${objName}<${relatedPerm}>`;
                        if (Permission.includes(permissionKey)) {
                            checkRevertingPermissions(objName, reqObjName, relatedPerm);
                        }

                    })
                }
                if (!isChecked && reqObjName === this.dataSetObject) {
                    if (RequiredPermission.includes(`${reqObjName}<${changedPermission}>`)) {
                        if (relatedPermissionsUncheckMap[changedPermission]) {
                            relatedPermissionsUncheckMap[changedPermission].forEach(relatedPerm => {
                                const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                                if (this.objDepPermissions[objName] && this.objDepPermissions[objName][valueKey]) {
                                    uncheckAndSetChildPermissions(objName, relatedPerm);
                                }
                            });
                        }
                    }

                }
                if (!isChecked && objName == this.dataSetObject && this.changedObjPermissions[reqObjName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        const permissionKey = `${objName}<${relatedPerm}>`;
                        if (Permission.includes(permissionKey)) {
                            uncheckRevertingPermissions(reqObjName, objName, relatedPerm);
                        }
                    })
                }
            });
        } catch (error) {
            console.error('Error in handleDependencies:', error.message || error, error.stack || '');
        }
    }
    //This Method is used to handle Object Permissions save Initiation for Profile and PermissionSet
    handleObjectPermSave() {
        for (let key in this.changedObjPermissions) {
            if (key != this.dataSetObject) {
                this.affectedSobject.push(key);
            }
        }
        if (this.changedObjPermissions) {
            for (let key in this.lastSavedObjPerm) {
                if (!this.updatedPermissions['objChange']) {
                    this.updatedPermissions['objChange'] = {};
                }
                if (!this.updatedPermissions['objChange'][this.dataSetObject]) {
                    this.updatedPermissions['objChange'][this.dataSetObject] = {};
                }
                if (this.lastSavedObjPerm[key] != this.objPermissions[key]) {
                    if (this.objPermissions[key] == true) {
                        this.updatedPermissions['objChange'][this.dataSetObject][key] = this.objPermissions[key];
                    }
                } else if (this.objPermissions[key] == false && this.updatedPermissions['objChange'][this.dataSetObject][key]) {
                    delete this.updatedPermissions['objChange'][this.dataSetObject][key];
                }
                if (Object.keys(this.updatedPermissions['objChange'][this.dataSetObject]).length === 0) {
                    delete this.updatedPermissions['objChange'][this.dataSetObject];
                }
            }
        }
        
        if ((this.updatedPermissions['objChange'] && Object.keys(this.updatedPermissions['objChange']).length > 0)) {
            this.disableCreatePermSet = false
        } else {
            this.disableCreatePermSet = true;
        }
        if (this.affectedSobject.length > 0) {
            let arrayString = this.affectedSobject.join(', ');
            const maxLength = 300;
            if (arrayString.length > maxLength) {
                arrayString = arrayString.substring(0, maxLength) + '...';
            }
            this.truncatedArrayString = arrayString;
            this.isModalOpen = true;
            if (this.typeValue == 'Profile') {
                this.isProfileAffectObject = true;
            } else if (this.typeValue == 'Permissionset') {
                this.isPermissionSetAffectObject = true;
            }
        } else {
            this.isModalOpen = true;
            if (this.typeValue == 'Profile') {
                this.isProfileAffect = true;
            } else if (this.typeValue == 'Permissionset') {
                this.isPermissionSetAffect = true;
            }
        }
    }
    
    //This Method is used to Update Object and field Permissions update for Profile and Permissionset from server
    objUpdateHandler(objMap,permSetId) {
        let originalValue = this.objDepPermissions[this.dataSetObject] ?
            this.objDepPermissions[this.dataSetObject] : {
                "PermissionsCreate": false,
                "PermissionsEdit": false,
                "PermissionsRead": false,
                "PermissionsDelete": false,
                "PermissionsModifyAllRecords": false,
                "PermissionsViewAllRecords": false
            };
        let samePermissionsAsPrevious = true;
        const permissionKeys = [
            "PermissionsCreate",
            "PermissionsEdit",
            "PermissionsRead",
            "PermissionsDelete",
            "PermissionsModifyAllRecords",
            "PermissionsViewAllRecords"
        ];
        for (const key of permissionKeys) {
            if (originalValue[key] !== this.objPermissions[key]) {
                samePermissionsAsPrevious = false;
                break;
            }
        }
        if (samePermissionsAsPrevious) {
            objMap = {};
        }
        this.showSpinner = true;
        updateObjPermissions({
                objPerms: objMap,
                permSetId: permSetId
            })
            .then(res => {
                if (res != null) {
                    console.log('check res' + JSON.stringify(res));
                    this.showSpinner = false;
                    this.handleShowToast('Object Permissions updated Successfully', 'Success', 'success');
                    this.isObjEditMode = false;
                    this.isObjEditDisabled = true;
                    this.changedObjPermissions = {};
                    this.enableCreatePermSet = false;
                    this.updatedPermissions = {};
                    this.affectedSobject = [];
                    this.isSaveDisabled = true;
                    this.isExistingPermission = false;
                    this.isCreateNewPermissionSet = false;
                    this.isModalOpen = false
                    this.isProfileAffect = false
                    this.isPermissionSetAffect = false
                    this.isProfileAffectObject = false
                    this.isPermissionSetAffectObject = false
                    this.isPermissionSetGroupAffect = false
                    this.isPermissionSetGroupAffectObject = false
                    if (res != null && res != undefined) {
                        if (res[this.dataSetObject]) {
                            this.objPermissions = res[this.dataSetObject];
                        }
                        Object.keys(res).forEach((key) => {
                            this.objDepPermissions[key] = JSON.parse(JSON.stringify(res[key]));
                        })
                    }
                    this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));
                } else {
                    this.showSpinner = false;
                    this.handleShowToast('Upsert Failed', 'Error', 'error');
                    this.isObjEditDisabled = true;
                    this.isObjEditMode = false;
                    this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                    this.changedObjPermissions = {};
                    this.enableCreatePermSet = false;
                    this.updatedPermissions = {};
                    this.affectedSobject = [];
                    this.isSaveDisabled = true;
                    this.isExistingPermission = false;
                    this.isCreateNewPermissionSet = false;
                    this.isModalOpen = false
                    this.isProfileAffect = false
                    this.isPermissionSetAffect = false
                    this.isProfileAffectObject = false
                    this.isPermissionSetAffectObject = false
                    this.isPermissionSetGroupAffect = false
                    this.isPermissionSetGroupAffectObject = false
                }
            })
            .catch(err => {
                console.log('check error' + JSON.stringify(err));
                this.showSpinner = false;
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: extractedMessage,
                        variant: 'error'
                    })
                );
                this.isObjEditDisabled = true;
                this.isObjEditMode = false;
                this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                this.changedObjPermissions = {};
                this.enableCreatePermSet = false
                this.updatedPermissions = {};
                this.affectedSobject = [];
                this.isSaveDisabled = true;
                this.isExistingPermission = false;
                this.isCreateNewPermissionSet = false;
                this.isModalOpen = false
                this.isProfileAffect = false
                this.isPermissionSetAffect = false
                this.isProfileAffectObject = false
                this.isPermissionSetAffectObject = false
                this.isPermissionSetGroupAffect = false
                this.isPermissionSetGroupAffectObject = false
            })
    }    
    //This Method is used to handle Helptext Icon to check the origin of selected Permissions
    handleHelpText(event) {
        this.profileName = [];
        this.permSetName = [];
        this.permSetGrpName = [];
        this.isProfile = false;
        this.isPermSet = false;
        this.isPermSetGrp = false;
        this.showSpinner = true;
        getObjOrFieldPermissionsOrigin({
                permissionType: event.target.name,
                permSetIds: this.permissionSetIds,
                objName: this.dataSetObject,
                fieldName: event.target.dataset.name
            })
            .then(res => {
                this.profileName = res['Profile'] ? res['Profile'][0] : '';
                this.isProfile = this.profileName && this.profileName.length > 0 ? true : false;
                this.permSetName = res['PermissionSet'];
                this.isPermSet = this.permSetName && this.permSetName.length > 0 ? true : false;
                this.permSetGrpName = res['Group'];
                this.isPermSetGrp = this.permSetGrpName && this.permSetGrpName.length > 0 ? true : false;
                this.showSpinner = false;
                this.showPopOver = true;
            })
            .catch(err => {
                console.log('check err', err);
                this.showSpinner = false;
            })

    }
    //This Method is used to handle the Helptext Modal Popup
    handleClosePopover() {
        this.showPopOver = false;
    }
    //This Method is used to Object and field Permissions update for Permissionsetgroup from server
    mutePermissionsHelper(groupId, objNames, objName) {
        getObjPermissionsForMutingPermSet({
                groupId: groupId,
                objNames: objNames,
                objName: objName
            })
            .then(res => {
                console.log('res' + JSON.stringify(res));
                if (res != null && res != '') {
                    this.mutedPermId = res.mutePermSetId;
                    this.muteObjDepPermissions = res.objectPermissions;
                    this.muteobjPermission = this.muteObjDepPermissions && this.muteObjDepPermissions[this.dataSetObject] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[this.dataSetObject])) : {
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsRead: false,
                        PermissionsDelete: false,
                        PermissionsModifyAllRecords: false,
                        PermissionsViewAllRecords: false
                    };
                    this.muteObjPermCache[this.dataSetObject] = JSON.parse(JSON.stringify(this.muteobjPermission));
                    this.lastSavedMutePerm = JSON.parse(JSON.stringify(this.muteobjPermission));
                    this.isShowObjectSpinner = false;
                } else {
                    this.handleShowToast('You Do not have access for creating new MutingPermissionSet', 'Success', 'success');
                    this.muteobjPermission = JSON.parse(JSON.stringify(this.lastSavedMutePerm));
                    this.isShowObjectSpinner = false;
                }
            })
            .catch(err => {
                console.log('err', JSON.stringify(err));
                this.muteobjPermission = JSON.parse(JSON.stringify(this.lastSavedMutePerm));
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', 'error');
                this.isShowObjectSpinner = false;
            })
    }
    //This Method is used to initiate the Mute Permission set Button
    handleMutePermissionsEdit() {
        this.isObjMuteEditDisabled = this.enableObjEditAccess ? false : true;
        this.isMuteMode = true;
    }
    //This Method is used to handle the Object Permission Change for PermissionSetGroup
    handleMutePermissionChange(event) {
        this.isSaveDisabled = false;
        let {
            name,
            checked
        } = event.target;
        switch (name) {
            case 'create':
                this.muteobjPermission.PermissionsCreate = checked;
                if (!checked && this.muteobjPermission.PermissionsRead) {
                    this.muteobjPermission.PermissionsRead = false;
                }
                break;
            case 'edit':
                this.muteobjPermission.PermissionsEdit = checked;
                if (!checked && this.muteobjPermission.PermissionsRead) {
                    this.muteobjPermission.PermissionsRead = false;
                }
                if (checked) {
                    if (!this.muteobjPermission.PermissionsDelete) {
                        this.muteobjPermission.PermissionsDelete = true;
                    }
                    if (!this.muteobjPermission.PermissionsModifyAllRecords) {
                        this.muteobjPermission.PermissionsModifyAllRecords = true;
                    }
                }
                break;

            case 'read':
                this.muteobjPermission.PermissionsRead = checked;
                if (checked) {
                    this.muteobjPermission.PermissionsCreate = true;
                    this.muteobjPermission.PermissionsEdit = true;
                    this.muteobjPermission.PermissionsDelete = true;
                    this.muteobjPermission.PermissionsViewAllRecords = true;
                    this.muteobjPermission.PermissionsModifyAllRecords = true;
                }
                break;

            case 'delete':
                this.muteobjPermission.PermissionsDelete = checked;
                if (!checked) {
                    if (this.muteobjPermission.PermissionsRead) {
                        this.muteobjPermission.PermissionsRead = false;
                    }
                    if (this.muteobjPermission.PermissionsEdit) {
                        this.muteobjPermission.PermissionsEdit = false;
                    }
                }
                if (checked && !this.muteobjPermission.PermissionsModifyAllRecords) {
                    this.muteobjPermission.PermissionsModifyAllRecords = true;
                }
                break;
            case 'viewAllRecords':
                this.muteobjPermission.PermissionsViewAllRecords = checked;
                if (!checked && this.muteobjPermission.PermissionsRead) {
                    this.muteobjPermission.PermissionsRead = false;
                }
                if (checked && !this.muteobjPermission.PermissionsModifyAllRecords) {
                    this.muteobjPermission.PermissionsModifyAllRecords = true;
                }
                break;
            case 'modifyAllRecords':
                this.muteobjPermission.PermissionsModifyAllRecords = checked;
                if (!checked) {
                    if (this.muteobjPermission.PermissionsRead) {
                        this.muteobjPermission.PermissionsRead = false;
                    }
                    if (this.muteobjPermission.PermissionsEdit) {
                        this.muteobjPermission.PermissionsEdit = false;
                    }
                    if (this.muteobjPermission.PermissionsDelete) {
                        this.muteobjPermission.PermissionsDelete = false;
                    }
                    if (this.muteobjPermission.PermissionsViewAllRecords) {
                        this.muteobjPermission.PermissionsViewAllRecords = false;
                    }
                }
                break;
            default:
        }
        this.changeObjMutePermissions[this.dataSetObject] = {
            ...this.muteobjPermission
        }
        if (this.objectDependencies.length > 0) {
            this.handleMuteDependencies(name, checked);
        }
        console.log('Changed permissions::::::', JSON.stringify(this.changeObjMutePermissions));
    }
    //This is Helper method to take care of Object to Object Dependencies for PermissionSetGroup
    handleMuteDependencies(changedPermission, isChecked) {
        const relatedPermissionsCheckMap = {
            read: ['read'],
            edit: ['read', 'edit'],
            delete: ['read', 'edit', 'delete'],
            create: ['read', 'create'],
            viewAllRecords: ['read', 'viewAllRecords'],
            modifyAllRecords: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords']
        };
        const relatedPermissionsUncheckMap = {
            read: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords', 'create'],
            edit: ['edit', 'delete', 'modifyAllRecords'],
            delete: ['delete', 'modifyAllRecords'],
            create: ['create'],
            viewAllRecords: ['viewAllRecords', 'modifyAllRecords'],
            modifyAllRecords: ['modifyAllRecords']
        };
        const allRelatedPerm = ['read', 'create', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords'];
        let objDependentPerm = JSON.parse(JSON.stringify(this.muteObjDepPermissions));
        console.log('Muted Dependent Perm to clone :: ', JSON.stringify(this.muteObjDepPermissions));
        console.log('New Object Dependent Perm :: ', JSON.stringify(objDependentPerm));

        const affectedPermissions = [];
        let processedObjects = {}
        try {
            this.objectDependencies.forEach(({
                Permission,
                RequiredPermission
            }) => {
                const [objName, permType] = Permission.split('<');
                const [reqObjName, reqPermType] = RequiredPermission.split('<');
                const checkAndMutePermissions = (objectName, permissionType, isChecked) => {
                    if (!objDependentPerm[objectName]) {
                        objDependentPerm[objectName] = {
                            PermissionsRead: false,
                            PermissionsEdit: false,
                            PermissionsDelete: false,
                            PermissionsCreate: false,
                            PermissionsViewAllRecords: false,
                            PermissionsModifyAllRecords: false,
                        };
                    }
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (!objDependentPerm[objectName][valueKey] && isChecked) {
                        objDependentPerm[objectName][valueKey] = true;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        if (!this.muteObjDepPermissions[objectName] || !this.muteObjDepPermissions[objectName][valueKey]) {
                            this.changeObjMutePermissions[objectName] = objDependentPerm[objectName];
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${permissionType}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (relatedPermissionsUncheckMap[permissionType]) {
                                relatedPermissionsUncheckMap[permissionType].forEach(relatedPerm => {
                                    checkAndMutePermissions(childObjName, relatedPerm, isChecked);
                                })
                            }
                        }
                    });

                }

                const unCheckRevertingMutePermissions = (requiredObjectName, objectName, relatedPerm) => {
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    const depPermissionValue = this.muteObjDepPermissions[objectName] ? {
                        ...this.muteObjDepPermissions[objectName]
                    } : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.muteObjDepPermissions[requiredObjectName] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[requiredObjectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    processedObjects[objectName] = processedObjects[objectName] ? processedObjects[objectName] : {
                        ...depPermissionValue
                    }
                    if (this.changeObjMutePermissions[requiredObjectName][valueKey] === reqPermission[valueKey]) {
                        this.changeObjMutePermissions[objectName] = processedObjects[objectName];
                    } else {
                        this.changeObjMutePermissions[objectName][valueKey] = this.changeObjMutePermissions[requiredObjectName][valueKey];
                        if (this.changeObjMutePermissions[objectName][valueKey]) {
                            relatedPermissionsUncheckMap[relatedPerm].forEach(depPerm => {
                                const depValueKey = `Permissions${depPerm.charAt(0).toUpperCase() + depPerm.slice(1)}`;
                                this.changeObjMutePermissions[objectName][depValueKey] = true;
                                processedObjects[objectName][depValueKey] = this.changeObjMutePermissions[objectName][depValueKey]
                            })
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (this.changeObjMutePermissions[childObjName]) {
                                unCheckRevertingMutePermissions(objectName, childObjName, relatedPerm);
                            }
                        }
                    })
                }
                const uncheckAndUnmutePermissions = (objectName, permissionType) => {
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (objDependentPerm[objectName] && objDependentPerm[objectName][valueKey]) {
                        objDependentPerm[objectName][valueKey] = false;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        this.changeObjMutePermissions[objectName] = objDependentPerm[objectName];
                        this.objectDependencies.forEach(dep => {
                            if (dep.Permission === `${objectName}<${permissionType}>`) {
                                const [parentObjName, parentPermType] = dep.RequiredPermission.split('<');
                                relatedPermissionsCheckMap[permissionType].forEach(relatedPerm => {
                                    uncheckAndUnmutePermissions(parentObjName, permissionType);
                                });
                            }
                        });
                    }
                }
                const checkRevertingMutePermissions = (objectName, requiredObjectName, relatedPerm) => {
                    const depPermissionValue = this.muteObjDepPermissions[requiredObjectName] ? this.muteObjDepPermissions[requiredObjectName] : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.muteObjDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    if (this.changeObjMutePermissions[objectName][valueKey] === reqPermission[valueKey]) {
                        this.changeObjMutePermissions[requiredObjectName][valueKey] = depPermissionValue[valueKey];
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            if (this.changeObjMutePermissions[parentObjName]) {
                                checkRevertingMutePermissions(requiredObjectName, parentObjName, relatedPerm);
                            }
                        }
                    })
                }
                if (isChecked && reqObjName === this.dataSetObject) {
                    if (RequiredPermission.includes(`${reqObjName}<${changedPermission}>`)) {
                        if (relatedPermissionsUncheckMap[changedPermission]) {
                            relatedPermissionsUncheckMap[changedPermission].forEach(relatedPerm => {
                                checkAndMutePermissions(objName, relatedPerm, isChecked);
                            })
                        }
                    }
                }
                if (!isChecked && reqObjName === this.dataSetObject && this.changeObjMutePermissions[objName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        if (RequiredPermission.includes(`${reqObjName}<${relatedPerm}>`)) {
                            unCheckRevertingMutePermissions(reqObjName, objName, relatedPerm)
                        }
                    })
                }
                if (!isChecked && objName === this.dataSetObject) {
                    if (relatedPermissionsCheckMap[changedPermission]) {
                        relatedPermissionsCheckMap[changedPermission].forEach(relatedPerm => {
                            if (Permission.includes(`${objName}<${relatedPerm}>`)) {
                                uncheckAndUnmutePermissions(reqObjName, relatedPerm);
                            }
                        });
                    }
                }
                if (isChecked && objName === this.dataSetObject && this.changeObjMutePermissions[reqObjName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        if (Permission.includes(`${objName}<${relatedPerm}>`)) {
                            checkRevertingMutePermissions(objName, reqObjName, relatedPerm)
                        }
                    })
                }
            })

        } catch (error) {
            console.error('Error in handleMuteDependencies:', error.message || error, error.stack || '');
        }
    }
    //This Method is used to handle Object Permissions save Initiation PermissionSetGroup
    handleMutePermSave() {
        for (let key in this.changeObjMutePermissions) {
            if (key != this.dataSetObject) {
                this.affectedSobject.push(key);
            }
        }
        if (this.affectedSobject.length > 0) {
            let arrayString = this.affectedSobject.join(', ');
            const maxLength = 300;
            if (arrayString.length > maxLength) {
                arrayString = arrayString.substring(0, maxLength) + '...';
            }
            this.truncatedArrayString = arrayString;
            this.isModalOpen = true;
            this.isPermissionSetGroupAffectObject = true;
        } else {
            this.isModalOpen = true;
            this.isPermissionSetGroupAffect = true;
        }
    }
    //This Method is used to Update Object and field Permissions update for Permissionsetgroup from server
    muteObjHandler(objPermission,mutedPermId) {
        let originalValue = this.muteObjDepPermissions[this.dataSetObject] ?
            this.muteObjDepPermissions[this.dataSetObject] : {
                "PermissionsCreate": false,
                "PermissionsEdit": false,
                "PermissionsRead": false,
                "PermissionsDelete": false,
                "PermissionsModifyAllRecords": false,
                "PermissionsViewAllRecords": false
            };
        let samePermissionsAsPrevious = true;

        const permissionKeys = [
            "PermissionsCreate",
            "PermissionsEdit",
            "PermissionsRead",
            "PermissionsDelete",
            "PermissionsModifyAllRecords",
            "PermissionsViewAllRecords"
        ];

        for (const key of permissionKeys) {
            if (originalValue[key] !== this.muteobjPermission[key]) {
                samePermissionsAsPrevious = false;
                break;
            }
        }
        if (samePermissionsAsPrevious) {
            objPermission = {};
        }
        this.showSpinner = true;
        updateObjPermissions({
                objPerms: objPermission,
                permSetId: mutedPermId
            })
            .then(res => {
                console.log('res', JSON.stringify(res));
                this.showSpinner = false;
                this.changeObjMutePermissions = {};
                this.affectedSobject = [];
                this.isSaveDisabled = true;
                this.isObjMuteEditDisabled = true;
                this.isProfileAffect = false
                this.isPermissionSetAffect = false
                this.isProfileAffectObject = false
                this.isPermissionSetAffectObject = false
                this.isPermissionSetGroupAffect = false
                this.isPermissionSetGroupAffectObject = false
                this.isMuteMode = false;

                if (res != null && res != undefined) {
                    if (res[this.dataSetObject]) {
                        this.muteobjPermission = {
                            ...res[this.dataSetObject]
                        };
                    }
                    Object.keys(res).forEach((key) => {
                        this.muteObjPermCache[key] = res[key];
                    });
                }
                this.lastSavedMutePerm = JSON.parse(JSON.stringify(this.muteobjPermission));
                this.handleShowToast('Muted Permissions Successfully', 'Success', 'success');
            })
            .catch(err => {
                console.log('err', JSON.stringify(err));
                this.showSpinner = false;
                this.muteobjPermission = JSON.parse(JSON.stringify(this.lastSavedMutePerm));
                this.isObjMuteEditDisabled = true;
                this.isMuteMode = false;
                this.changeObjMutePermissions = {};
                this.affectedSobject = [];
                this.isSaveDisabled = true;
                this.isProfileAffect = false
                this.isPermissionSetAffect = false
                this.isProfileAffectObject = false
                this.isPermissionSetAffectObject = false
                this.isPermissionSetGroupAffect = false
                this.isPermissionSetGroupAffectObject = false
                let errorMessage = err.body.message;                
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: extractedMessage,
                        variant: 'error'
                    })
                );
            });
    }
    //This Method is used to Handle Showtoast event
    handleShowToast(message, title, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: "dismissible"
            })
        );
    }
    //This Method Handle to initiate objet and field Update directly in Profile/PermissionSet/Group
    handleConfirm(event) {
        if (event.target.name == 'profile Confirm') {
            this.objUpdateHandler(this.changedObjPermissions,this.permissionSetIdToUpdate)
        }
        if (event.target.name == 'profile affect confirm') {
            this.objUpdateHandler(this.changedObjPermissions,this.permissionSetIdToUpdate)
        }
        if (event.target.name == 'persetgrp confirm') {
            this.muteObjHandler(this.changeObjMutePermissions,this.mutedPermId)
        }
        if (event.target.name == 'persetgrp affect object confirm') {
            this.muteObjHandler(this.changeObjMutePermissions,this.mutedPermId)
        }
        this.isModalOpen = false;
    }

    //This method is used to open the user List Modal for profile/PermissionSer/Group
    handleOpenUserModal() {
        this.previousTemplateState = {
            isProfileAffect: this.isProfileAffect,
            isPermissionSetAffect: this.isPermissionSetAffect,
            isProfileAffectObject: this.isProfileAffectObject,
            isPermissionSetAffectObject: this.isPermissionSetAffectObject,
            isPermissionSetGroupAffect: this.isPermissionSetGroupAffect,
            isPermissionSetGroupAffectObject: this.isPermissionSetGroupAffectObject,
        };
        if (this.isProfileAffect == true) {
            this.isProfileAffect = false;
        }
        if (this.isPermissionSetAffect == true) {
            this.isPermissionSetAffect = false;
        }
        if (this.isProfileAffectObject == true) {
            this.isProfileAffectObject = false;
        }
        if (this.isPermissionSetAffectObject == true) {
            this.isPermissionSetAffectObject = false;
        }
        if (this.isPermissionSetGroupAffect == true) {
            this.isPermissionSetGroupAffect = false;
        }
        if (this.isPermissionSetGroupAffectObject == true) {
            this.isPermissionSetGroupAffectObject = false;
        }
        this.isModalOpen = false;
        this.isUsersTable = true;
        if (this.previousTemplateState.isProfileAffect || this.previousTemplateState.isProfileAffectObject) {
            this.isProfileAffectHeading = true;
        } else if (this.previousTemplateState.isPermissionSetAffect || this.previousTemplateState.isPermissionSetAffectObject) {
            this.isPermissionSetAffectHeading = true;
        } else if (this.previousTemplateState.isPermissionSetGroupAffect || this.previousTemplateState.isPermissionSetGroupAffectObject) {
            this.isPermissionSetGroupAffectHeading = true;
        }
    }
    //This Method is used to handle Existiong PermissionSet initiation
    handleExistingPermissionSet() {
        this.isExistingPermission = true;
    }
    //This Initiation Method is used to handle update Permissionset which we make in profile 
    handleUpdateExistingPermissionSet(event) {
        this.showSpinner = true;
        let permissionId = event.target.dataset.id;
        let changedExistingPermissions = {
            existingObjPermissions: {},
            existingFieldpermissions: []
        }
        if (this.changedObjPermissions) {
            const relatedPermissionsCheckMap = {
                PermissionsRead: ['PermissionsRead'],
                PermissionsEdit: ['PermissionsRead', 'PermissionsEdit'],
                PermissionsDelete: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete'],
                PermissionsCreate: ['PermissionsRead', 'PermissionsCreate'],
                PermissionsViewAllRecords: ['PermissionsRead', 'PermissionsViewAllRecords'],
                PermissionsModifyAllRecords: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete', 'PermissionsViewAllRecords', 'PermissionsModifyAllRecords']
            };
            let uniqueObjName = new Set();
            if (this.changedObjPermissions && Object.keys(this.changedObjPermissions).length > 0) {
                for (let permission in relatedPermissionsCheckMap) {
                    if (this.updatedPermissions['objChange'][this.dataSetObject][permission] &&
                        this.updatedPermissions['objChange'][this.dataSetObject][permission] == true) {
                        relatedPermissionsCheckMap[permission].forEach(relatedPerm => {
                            this.updatedPermissions['objChange'][this.dataSetObject][relatedPerm] = true;
                        })
                    }
                }

                if (this.updatedPermissions['objChange'] && this.objectDependencies.length > 0) {
                    uniqueObjName.add(this.dataSetObject);
                    const findRequiredObjects = (currentObjName) => {
                        let foundNewObject = false;
                        this.objectDependencies.forEach(({
                            Permission,
                            RequiredPermission
                        }) => {
                            const [objName, permType] = Permission.split('<');
                            const [reqObjName, reqPermType] = RequiredPermission.split('<');
                            let permTypeChange = 'Permissions' + permType.replace('>', '').replace(/^./, str => str.toUpperCase());
                            let reqPermTypeChange = 'Permissions' + reqPermType.replace('>', '').replace(/^./, str => str.toUpperCase());
                            if (objName === currentObjName && this.updatedPermissions['objChange'][currentObjName][permTypeChange]) {
                                if (!this.updatedPermissions['objChange'][reqObjName]) {
                                    this.updatedPermissions['objChange'][reqObjName] = {};
                                }
                                this.updatedPermissions['objChange'][reqObjName][reqPermTypeChange] = true;
                                if (!uniqueObjName.has(reqObjName)) {
                                    uniqueObjName.add(reqObjName);
                                    foundNewObject = true;
                                }
                            }
                        });
                        return foundNewObject;
                    };

                    // Start checking with this.dataSetObject
                    let currentObjName = this.dataSetObject;
                    while (findRequiredObjects(currentObjName)) {
                        currentObjName = Array.from(uniqueObjName).pop();
                    }

                }
            }
            getSelectePermissionsetObjResult({
                    permSetId: permissionId,
                    objNames: Array.from(uniqueObjName)
                })
                .then(res => {
                    console.log('check rest ', res);
                    if (Array.from(uniqueObjName).length > 0) {
                        Array.from(uniqueObjName).forEach(objName => {
                            changedExistingPermissions['existingObjPermissions'][objName] = res && res[objName] ? JSON.parse(JSON.stringify(res[objName])) : {
                                PermissionsCreate: false,
                                PermissionsRead: false,
                                PermissionsDelete: false,
                                PermissionsEdit: false,
                                PermissionsViewAllRecords: false,
                                PermissionsModifyAllRecords: false
                            }
                        })
                    }
                    if (this.updatedPermissions['objChange']) {
                        Object.keys(this.updatedPermissions['objChange']).forEach(objectName => {
                            if (changedExistingPermissions['existingObjPermissions'][objectName]) {
                                Object.keys(this.updatedPermissions['objChange'][objectName]).forEach(permissionKey => {
                                    if (this.updatedPermissions['objChange'][objectName][permissionKey] === true &&
                                        changedExistingPermissions['existingObjPermissions'][objectName][permissionKey] === false) {
                                        relatedPermissionsCheckMap[permissionKey].forEach(relatedPermission => {
                                            changedExistingPermissions['existingObjPermissions'][objectName][relatedPermission] = true;
                                        });
                                    }
                                })
                            }
                        })
                    }
                    this.existingPermissionSetUpdate(changedExistingPermissions['existingObjPermissions'],permissionId)

                }).catch(err => {
                    console.log('err>>>', JSON.stringify(err))
                    this.showSpinner = false;
                    this.handleShowToast('Failed to retrieved Object Permissions of the Existing Permission Sets', 'Error', 'error');
                })
        }
    }
    //This Helper Method Server call to handle update Permissionset which we make in profile 
    existingPermissionSetUpdate(objMap,permSetId) {
        this.showSpinner = true;
        updateObjPermissions({
                objPerms: objMap,
                permSetId: permSetId
            })
            .then(res => {
                console.log('check res' + JSON.stringify(res));
                if (res != null) {
                    this.handleShowToast('Object and Field are successfully updated on PermissionSet', 'Success', 'success');
                    this.resetChanges()

                } else {
                    this.handleShowToast('Update Failed', 'Error', 'error');
                    this.resetChanges()

                }
            })
            .catch(err => {
                console.log('check error' + JSON.stringify(err));
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', 'error');
                this.resetChanges()

            })
    }
    //This Method is used to reset all the changes
    resetChanges() {
        this.isExistingPermission = false;
        this.isCreateNewPermissionSet = false;
        this.isObjEditDisabled = true;
        this.isObjEditMode = false;
        this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));;
        this.changedObjPermissions = {};
        this.enableCreatePermSet = false
        this.updatedPermissions = {};
        this.affectedSobject = [];
        this.isSaveDisabled = true;
        this.isModalOpen = false
        this.isProfileAffect = false
        this.isPermissionSetAffect = false
        this.isProfileAffectObject = false
        this.isPermissionSetAffectObject = false
        this.isPermissionSetGroupAffect = false
        this.isPermissionSetGroupAffectObject = false
        this.showSpinner = false;

    }
    //This Method is used to handle Profile to Create New PermissionSet open popup 
    handleCreatePermissionSet() {
        this.isCreateNewPermissionSet = true;
    }
    //This Method is used to handle Profile to Create New PermissionSet close popup 
    closeCreateModal() {
        this.isCreateNewPermissionSet = false;
    }
    //This Method is to handle Custom Event which fire from ManagePermissionSetCreate Component
    handleCustomEvent(event) {
        this.resetChanges();
        this.permissionSetIds.push(event.detail.Id);
        this.permSetList.push(event.detail);
        this.dispatchEvent(new CustomEvent("newpermissionsettoadd", {
            detail: event.detail,
            bubbles: true,
            composed: true,
        }));
    }
    //This Method is to handle Custom Event which fire from from PermissionAnalyzerRecordType Component
    handleRecCustomEvent(event) {
        this.permissionSetIds.push(event.detail.Id);
        this.permSetList.push(event.detail);
    }
    //This is custom method to handle Field Permission cache
    fieldPermissonCacheHandler(event) {
        this.fieldPermissionsCache[this.dataSetObject] = JSON.parse(JSON.stringify(event.detail));
    }
    //This is custom method to handle Record Type Permission cache
    recPermissonCacheHandler(event) {
        this.recordTypeCache[this.dataSetObject] = JSON.parse(JSON.stringify(event.detail));
    }
}