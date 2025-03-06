//This Component is used to handle User Permissions for Profile PermissionSet and PermissionSetGroup
//This Component is used as child Component under PermissionAnalyzer
import {LightningElement, api,  track} from 'lwc';
import getCombinedUserPermissionsForUser from '@salesforce/apex/UserPermissionAnalyzerServer.getCombinedUserPermissionsForUser'
import getMutedUserPermissionOfPermSetGrp from '@salesforce/apex/UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp'
import getSelectedUserPermissionOrigins from '@salesforce/apex/UserPermissionAnalyzerServer.getSelectedUserPermissionOrigins'
import updateUserPermissionsforProfOrPermSetOrMuteGroups from '@salesforce/apex/UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { debounce } from 'c/utils';

export default class UserPermissionAnalyzer extends LightningElement {
    @api permSetIdToFetch;
    @api enableEdit;
    @api permissionName;
    @api permSetGrpId;
    @api enableHelpText;
    @api profileType;
    @api type;
    @api enableMute;
    @api userId;
    @api userLabel;
    @track userPermissions = [];
    @track userPermissionDependencies = [];
    @track lastSavedUserPermissions = [];
    @track changedUserPermissions = {};
    hasUser = true;
    isUserPerm = false;
    hasEditAccess = false;
    showSpinner = false;
    searchUserPermKey = '';
    disabledUserEdit = true;
    isEditMode = false;
    profileName;
    permSetName;
    permSetGrpName;
    isProfile = false;
    isPermSet = false;
    isPermSetGrp = false;
    showPopOver = false;
    isUpdateDisabled = true;
    userFieldName = ''
    permSetIdToUpdate = '';
    @api userValue;
    @api userValueLength;
    isModalOpen = false;
    isProfileAffect = false;
    isPermissionSetAffect = false;
    isProfileAffectUser = false;
    isPermissionSetAffectUser = false;
    isPermissionSetGroupAffect = false;
    isPermissionSetGroupAffectUser = false;
    permSetList = [];
    isCreatePermSet = false;
    isExistingPermissionSet = false;
    isNewPermSet = false;
    permSetIds = []
    userPermUpdate = {}
    requiredPermissionSet = new Set();
    permissionSet = new Set();
    requiredPermissionArrayString;
    permissionArrayString;
    @track sortBy;
    @track sortDirection;
    @track state = {
        permissions: new Map(),
        searchKey: '',
        loading: false,
        error: null
    };
    permissionCache = new Map();
    searchCache = new Map();
    handleSearchKeyChange = debounce((event) => {
        this.filterPermissions(event.target.value);
    }, 300);
    @api
    get permissionSetIds() {
        return this.permSetIds;
    }
    set permissionSetIds(value) {
        this.permSetIds = JSON.parse(JSON.stringify(value));
    }
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
        isProfileAffectUser: false,
        isPermissionSetAffectUser: false,
        isPermissionSetGroupAffect: false,
        isPermissionSetGroupAffectUser: false,
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
    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //Helper method for sorting data
    sortData(fieldName, sortDirection) {
        let data1 = JSON.parse(JSON.stringify(this.uservalue));
        let keyValue = (a) => a[fieldName];
        let isReverse = sortDirection === 'asc' ? 1 : -1;
 
        data1.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.uservalue = data1;
    }
    //This getter funtion we handled search user Permissions in UI level.
    get filteredUserPermList() {
        if (this.searchUserPermKey) {
            return this.userPermissions.filter(userPerm => userPerm.fieldLabel.toLowerCase().includes(this.searchUserPermKey.toLowerCase()));
        }
        return this.userPermissions;
    }
    //From this connectedCallBack Method we set hasEditAccess based on ProfileType 
    connectedCallback() {
        console.log('call from connected callback : ');
        this.showSpinner = true;
        this.hasEditAccess = this.enableEdit == true && this.profileType != 'Standard' ? true : false
        this.getUserPermissionsDetail();
    }
    //This wired method to get the combined UserPermissions based on permissionSetIds
    getUserPermissionsDetail(){
        getCombinedUserPermissionsForUser({permissionSetIds:this.permSetIdToFetch})
        .then(data=>{
            this.showSpinner = false;
            this.userPermissions = JSON.parse(JSON.stringify(data.combinedWrapper));
            this.userPermissionDependencies = [...data.permDependency];
            this.userPermissions = this.userPermissions.sort((a, b) => {
                if (a.fieldValue === b.fieldValue) {
                    return a.fieldLabel.localeCompare(b.fieldLabel);
                } else {
                    return a.fieldValue === true ? -1 : 1;
                }
            })
            this.isUserPerm = this.userPermissions.length > 0 ? true : false
            if (this.permSetGrpId != '' && this.permSetGrpId != null) {
                this.showSpinner = true
                this.userPermissions.forEach(user => {
                    if (this.userFieldName !== '') {
                        this.userFieldName += ', ';
                    }
                    this.userFieldName += user.fieldName;
                })
                this.getMutePermissions(this.permSetGrpId, this.userFieldName, this.userPermissions)
            } else {
                this.permSetIdToUpdate = this.permSetIdToFetch;
                this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.userPermissions))
            }
        }).catch(error=>{
            console.log('error : ', JSON.stringify(error));
            this.showSpinner = false;
        })
    }    
    //This Method is used to search input event handler
    handleSearchKeyChange(event) {
        this.searchUserPermKey = event.target.value;
        this.hasUser = this.filteredUserPermList.length > 0 ? true : false
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
        getSelectedUserPermissionOrigins({
                permissionType: event.target.name,
                permSetIds: this.permSetIds
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
    //This Method is used to initiate edit button
    handleUserEdit() {
        this.isEditMode = true;
        this.disabledUserEdit = false;
    }
    //This Method is used to cancel and revert back the changes based on respective cancel buttons
    handleUserCancel(event) {
        if (event.target.name == 'user cancel') {
            this.isUsersTable = false;
            this.isProfileAffect = this.previousTemplateState.isProfileAffect;
            this.isProfileAffectUser = this.previousTemplateState.isProfileAffectUser;
            this.isPermissionSetAffect = this.previousTemplateState.isPermissionSetAffect;
            this.isPermissionSetAffectUser = this.previousTemplateState.isPermissionSetAffectUser;
            this.isPermissionSetGroupAffect = this.previousTemplateState.isPermissionSetGroupAffect;
            this.isPermissionSetGroupAffectUser = this.previousTemplateState.isPermissionSetGroupAffectUser;
            this.previousTemplateState = {};
            this.isModalOpen = true;
        }
        if (event.target.name == 'User Update Cancel') {
            this.isEditMode = false
            this.userPermissions = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
            this.isUpdateDisabled = true;
            this.disabledUserEdit = true;
            this.changedUserPermissions = {};
            this.isModalOpen = false;
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectUser = false;
            this.isPermissionSetAffectUser = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectUser = false;
            this.userPermUpdate = {}            
            this.requiredPermissionArrayString = [];
            this.permissionArrayString = [];
        }
        if (event.target.name == 'profile cancel') {
            this.isModalOpen = false;
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectUser = false;
            this.isPermissionSetAffectUser = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectUser = false;
            this.userPermUpdate = {}
            this.requiredPermissionArrayString = [];
            this.permissionArrayString = [];
        }
        if (event.target.name == 'profile affect cancel') {
            this.isModalOpen = false;
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectUser = false;
            this.isPermissionSetAffectUser = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectUser = false;
            this.userPermUpdate = {}
            this.requiredPermissionArrayString = [];
            this.permissionArrayString = [];
        }
        if (event.target.name == 'persetgrp affect object cancel') {
            this.isModalOpen = false;
            this.isModalOpen = false;
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectUser = false;
            this.isPermissionSetAffectUser = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectUser = false;
            this.userPermUpdate = {}            
            this.requiredPermissionArrayString = [];
            this.permissionArrayString = [];
        }
        if (event.target.name == 'persetgrp cancel') {
            this.isModalOpen = false;
            this.isModalOpen = false;
            this.isProfileAffect = false;
            this.isPermissionSetAffect = false;
            this.isProfileAffectUser = false;
            this.isPermissionSetAffectUser = false;
            this.isPermissionSetGroupAffect = false;
            this.isPermissionSetGroupAffectUser = false;
            this.userPermUpdate = {}            
            this.requiredPermissionArrayString = [];
            this.permissionArrayString = [];
        }
        if (event.target.name == 'Existing PermissionSet cancel') {
            this.isExistingPermissionSet = false;
        }
    }
    //This Method is used to handle user Permissions input checkbox change
    handleSystemPermissionChangePS(event) {
        this.isUpdateDisabled = false;
        const permissionName = event.target.name;
        const isChecked = event.detail.checked;
        let fieldName = permissionName.replace('Permissions', '');
        this.changedUserPermissions[fieldName] = isChecked;
        try {
            if (isChecked) {
                this.checkPermissionDependencies(fieldName);
            } else {
                this.uncheckPermissionDependencies(fieldName);
            }
        } catch (error) {
            console.error('Error in handleDependencies:', error.message || error, error.stack || '');
        }
        this.userPermissions = this.userPermissions.map(user => {
            Object.keys(this.changedUserPermissions).forEach(key => {
                let permissionKey = "Permissions" + key;
                if (user.fieldName === permissionKey) {
                    user.fieldValue = this.changedUserPermissions[key];
                }
            });
            return user;
        });
        console.log('this.changedUserPermissions : ',JSON.stringify(this.changedUserPermissions));
    }
    //This method is used to maintain User to User Permission Dependencies to grant parent access if child access is granted    
    checkPermissionDependencies(fieldName) {
        this.userPermissionDependencies.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (Permission === fieldName) {
                const requiredField = 'Permissions' + RequiredPermission;
                const requiredUserPermission = this.userPermissions.find(obj => obj.fieldName === requiredField);
                if (requiredUserPermission && !requiredUserPermission.fieldValue) {
                    this.changedUserPermissions[RequiredPermission] = true;
                    this.requiredPermissionSet.add(RequiredPermission);
                    this.permissionSet.add(Permission);
                    this.checkPermissionDependencies(RequiredPermission);
                }
            }
        });
    }
    //This method is used to maintain User to User Permission Dependencies to remove child access if parent access is removed
    uncheckPermissionDependencies(fieldName) {
        this.userPermissionDependencies.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (RequiredPermission === fieldName) {
                const dependentField = 'Permissions' + Permission;
                const dependentPermission = this.userPermissions.find(obj => obj.fieldName === dependentField);
                if (dependentPermission && dependentPermission.fieldValue) {
                    this.changedUserPermissions[Permission] = false;
                    this.requiredPermissionSet.add(RequiredPermission);
                    this.permissionSet.add(Permission);
                    this.uncheckPermissionDependencies(Permission);
                }
            }
        });
    }
    //This Methos is used to Update UserPermissions for Profile or permissonset
    handleUpdatePermissionSet() {
        if (this.changedUserPermissions && this.changedUserPermissions != null) {
            Object.entries(this.changedUserPermissions).forEach(([key, value]) => {
                if (value === true) {
                    this.userPermUpdate[key] = value;
                }
            });
            this.isCreatePermSet = this.userPermUpdate && Object.keys(this.userPermUpdate).length > 0 ? false : true;
            Object.keys(this.userPermUpdate).forEach(userPerm => {
                this.profToPermDependencies(userPerm);
            });
        }
        this.isModalOpen = true;
        this.requiredPermissionArrayString = Array.from(this.requiredPermissionSet);
        this.permissionArrayString = Array.from(this.permissionSet);
        if (this.type == 'Profile') {
            if (this.requiredPermissionArrayString.length > 0 || this.permissionArrayString.length > 0) {
                this.isProfileAffectUser = true;
                this.isProfileAffect = false;
            } else {
                this.isProfileAffectUser = false;
                this.isProfileAffect = true;
            }
        } else if (this.type == 'Permissionset') {
            if (this.requiredPermissionArrayString.length > 0 || this.permissionArrayString.length > 0) {
                this.isPermissionSetAffectUser = true;
                this.isPermissionSetAffect = false;
            } else {
                this.isPermissionSetAffectUser = false;
                this.isPermissionSetAffect = true;
            }
        } else {
            if (this.requiredPermissionArrayString.length > 0 || this.permissionArrayString.length > 0) {
                this.isPermissionSetGroupAffectUser = true;
                this.isPermissionSetGroupAffect = false;
            } else {
                this.isPermissionSetGroupAffectUser = false;
                this.isPermissionSetGroupAffect = true;
            }
        }
    }
    //This Method is used to handle permissionDependencies for profile to PermisisonSet Update and Create
    profToPermDependencies(fieldName) {
        this.userPermissionDependencies.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (Permission === fieldName) {
                this.userPermUpdate[RequiredPermission] = true;
                this.profToPermDependencies(RequiredPermission);
            }
        });
        console.log('after updated : ', JSON.stringify(this.userPermUpdate));
    }
    //This Method is used to call the server to  Update directly user Permissions on PermissionSet/Profile 
    handleConfirm() {
        this.showSpinner = true;
        updateUserPermissionsforProfOrPermSetOrMuteGroups({
                permSetId: this.permSetIdToUpdate,
                profileName: this.permissionName,
                systemPermissions: this.changedUserPermissions
            })
            .then(res => {
                console.log('res', JSON.stringify(res));
                this.handleShowToast('Successfully updated user permissions', 'Success', 'success');
                this.resetChanges();
            }).catch(err => {
                console.log('err', JSON.stringify(err))
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.userPermissions = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                this.handleShowToast(extractedMessage, 'Error', 'error')
                this.resetChanges();

            })
    }
    //This Method is used get the Muting PermissionSet for the Permissionsetgroup 
    getMutePermissions(grpId, fieldName, userPermList) {
        getMutedUserPermissionOfPermSetGrp({
                groupId: grpId,
                fieldNames: fieldName,
                userPermissions: userPermList
            })
            .then(res => {
                console.log('res', res);
                this.showSpinner = false;
                this.userPermissions = JSON.parse(JSON.stringify(res.mutePermissions))
                this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.userPermissions));
                this.permSetIdToUpdate = res.muteId;
            })
            .catch(err => {
                console.log('err', err);
                this.showSpinner = false;
            })
    }
    //This Method is used handle the muting permissionset checkbox input change
    handleSystemPermissionChangeMutePS(event) {
        this.isUpdateDisabled = false;
        const permissionName = event.target.name;
        const isChecked = event.detail.checked;
        let fieldName = permissionName.replace('Permissions', '');
        this.changedUserPermissions[fieldName] = isChecked;
        try {
            if (isChecked) {
                this.checkPermissionDependenciesMute(fieldName);
            } else {
                this.uncheckPermissionDependenciesMute(fieldName);
            }
        } catch (error) {
            console.error('Error in handleDependencies:', error.message || error, error.stack || '');
        }
        this.userPermissions = this.userPermissions.map(user => {
            Object.keys(this.changedUserPermissions).forEach(key => {
                let permissionKey = "Permissions" + key;
                if (user.fieldName === permissionKey) {
                    user.fieldValueMute = this.changedUserPermissions[key];
                }
            });
            return user;
        });
        console.log('this.changedUserPermissions : ',this.changedUserPermissions);
    }
    //This method is used to maintain User to User Permission Dependencies to Mute child access if parent access is Muted
    checkPermissionDependenciesMute(fieldName) {
        this.userPermissionDependencies.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (RequiredPermission === fieldName) {
                const dependentField = 'Permissions' + Permission;
                const dependentUserPermission = this.userPermissions.find(obj => obj.fieldName === dependentField);
                if (dependentUserPermission && !dependentUserPermission.fieldValueMute) {
                    this.changedUserPermissions[Permission] = true;
                    this.requiredPermissionSet.add(RequiredPermission);
                    this.permissionSet.add(Permission);
                    this.checkPermissionDependenciesMute(Permission);
                }
            }
        });
    }
    //This method is used to maintain User to User Permission Dependencies to UnMute Parent access if Chidl access is UnMuted
    uncheckPermissionDependenciesMute(fieldName) {
        this.userPermissionDependencies.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (Permission === fieldName) {
                const reqField = 'Permissions' + RequiredPermission;
                const reqPermission = this.userPermissions.find(obj => obj.fieldName === reqField);
                if (reqPermission && reqPermission.fieldValueMute) {
                    this.changedUserPermissions[RequiredPermission] = false;
                    this.requiredPermissionSet.add(RequiredPermission);
                    this.permissionSet.add(Permission);
                    this.uncheckPermissionDependenciesMute(RequiredPermission);
                }
            }
        });
    }
    //This Method is used to handle user Modal based on Profile/PermissionSet/Group
    handleOpenUserModal() {
        this.previousTemplateState = {
            isProfileAffect: this.isProfileAffect,
            isPermissionSetAffect: this.isPermissionSetAffect,
            isProfileAffectUser: this.isProfileAffectUser,
            isPermissionSetAffectUser: this.isPermissionSetAffectUser,
            isPermissionSetGroupAffect: this.isPermissionSetGroupAffect,
            isPermissionSetGroupAffectUser: this.isPermissionSetGroupAffectUser,
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
    }
    //This Method is used to handle Existiong PermissionSet initiation
    handleExistingPermissionSet() {
        this.isExistingPermissionSet = true;
    }
    //This Method is used to handle update Permissionset which we make in profile 
    handleUpdateExistingPermissionSet(event) {
        this.showSpinner = true;
        let permSet = this.permSetList.find(e => e.Id == event.target.dataset.id);
        updateUserPermissionsforProfOrPermSetOrMuteGroups({
                permSetId: permSet.Id,
                profileName: '',
                systemPermissions: this.userPermUpdate
            })
            .then(res => {
                console.log('res', JSON.stringify(res));
                this.handleShowToast(`Successfully updated userpermissions in selected Permission set : ${permSet.Name}`, 'Success', 'success');
                this.userPermissions = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                this.resetChanges()
            }).catch(err => {
                console.log('err', JSON.stringify(err))
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.userPermissions = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                this.handleShowToast(extractedMessage, 'Error', 'error')
                this.resetChanges();
            })
    }
    //This Method is used to handle Profile to Create New PermissionSet open popup 
    handleCreatePermissionSet() {
        this.isNewPermSet = true;
    }
    //This Method is used to handle Profile to Create New PermissionSet close popup 
    closeCreateModal() {
        this.isNewPermSet = false;
    }
    //This Method is to handle Custom Event which fire from child
    handleCustomEvent(event) {
        this.resetChanges();
        this.userPermissions = JSON.parse(JSON.stringify(this.lastSavedUserPermissions))
        this.permSetList.push(event.detail);
        this.permSetIds.push(event.detail.Id);
        this.dispatchEvent(new CustomEvent("newpermissionsettoadd", {
            detail: event.detail,
            bubbles: true,
            composed: true,
        }));
    }
    //This Method is used to reset all the changes
    resetChanges() {
        this.isModalOpen = false;
        this.isProfileAffect = false;
        this.isPermissionSetAffect = false;
        this.isProfileAffectUser = false;
        this.isPermissionSetAffectUser = false;
        this.isPermissionSetGroupAffect = false;
        this.isPermissionSetGroupAffectUser = false;
        this.userPermUpdate = {}
        this.showSpinner = false;
        this.isEditMode = false
        this.isUpdateDisabled = true;
        this.disabledUserEdit = true;
        this.changedUserPermissions = {};
        this.isCreatePermSet = true;
        this.isExistingPermissionSet = false;
        this.isNewPermSet = false;
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
    filterPermissions(searchTerm) {
        const cacheKey = searchTerm.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            this.filteredUserPermList = this.searchCache.get(cacheKey);
            return;
        }

        const filtered = this.userPermissions.filter(perm => 
            perm.fieldLabel.toLowerCase().includes(cacheKey)
        );

        this.searchCache.set(cacheKey, filtered);
        this.filteredUserPermList = filtered;
        this.hasUser = filtered.length > 0;
    }
    processPermissionUpdates(permissions, batchSize = 50) {
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
    @api
    handleError(error) {
        console.error('Permission Analyzer Error:', error);
        this.showErrorToast(error);
        this.resetState();
    }
    measureOperation(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }
    disconnectedCallback() {
        this.clearCaches();
    }
}