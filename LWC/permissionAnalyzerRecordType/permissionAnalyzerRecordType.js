//This Component is used to handle RecordType Visibility for Profile and PermissionSet
//This Component is used as child Component under PermissionAnalyzer
import {LightningElement, api, track} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getRecTypeVisibilityForProfileAndPermSet from '@salesforce/apex/PermissionAnalyzerRecordTypeServer.getRecTypeVisibilityForProfileAndPermSet';
import updateRecordTypeVisibility from '@salesforce/apex/PermissionAnalyzerRecordTypeServer.updateRecordTypeVisibility';
import { debounce } from 'c/utils';

export default class PermissionAnalyzerRecordType extends LightningElement {
    @api enableRecordTypeEdit;
    @api permSetId;
    @api objectName;
    @api enabledDefault;
    @api userId;
    @api permName;
    @api permissionType;
    isSaveRecDisabled = true;
    isEditRecTypeDisabled = true;
    isEditRecTypeMode = false
    @track showSpinner = true
    isShowSpinner = false;
    @track recordTypes = [];
    @track changedRecordType = [];
    @track lastSavedRecType = [];
    showRecordType = false;
    @track searchKey = '';
    @track hasRecType = true;
    disableCreatePermissionSet = true;
    @api userValue
    @api userValueLength;
    showUsers = true;
    isModalOpen = false;
    isRecPro = false;
    isRecDefPro = false;
    isRecPerSet = false;
    isExistingPermissionSet = false
    permSetList = [];
    profToPermSet = [];
    isNewPermSet = false;
    isRecProHeading = false;
    isRecPerSetHeading = false;
    @api profName;
    @api persetName;
    @api recordTypeCache = new Map();
    //Used to get PermissionSet List for the user and also Initiate server call to get the RecordType Visibility for the Selected Profile/permissionSet
    @api
    get permSetLists() {
        return this.permSetList;
    }
    set permSetLists(value) {
        this.permSetList = JSON.parse(JSON.stringify(value));
         if(this.recordTypeCache.has(this.objectName))
        {
            this.showSpinner = false;
            this.recordTypes = JSON.parse(JSON.stringify(this.recordTypeCache.get(this.objectName)));
            this.showRecordType = this.recordTypes.length > 0 ? true : false;
        }
        else
        {
            this.getRecTypeVisibilityForProfileAndPermSetHandler(this.objectName, this.permSetId, this.permissionType, this.permName);
        }
    }
    previousTemplateState = {
        isRecPro: false,
        isRecDefPro: false,
        isRecPerSet: false,
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
    //This is Helper Method to Call Server to Fetch RecordType Visibilities of Respective Profile/PermissionSet
    getRecTypeVisibilityForProfileAndPermSetHandler(objName, permissionSetId, profileOrPermissionSetType, profileOrPermSetName) {
        getRecTypeVisibilityForProfileAndPermSet({
                objName: objName,
                permissionSetId: permissionSetId,
                profileOrPermissionSetType: profileOrPermissionSetType,
                profileOrPermSetName: profileOrPermSetName
            })
            .then(data => {
                console.log('data : ', JSON.stringify(data))
                this.showSpinner = false;
                let uniqueRecType = data.recordTypeList.map(rec => {
                    let objNameRecType = rec.NamespacePrefix == null ? this.objectName + '.' + rec.DeveloperName : this.objectName + '.' + rec.NamespacePrefix + '__' + rec.DeveloperName;
                    let personAccount = rec.Name == 'Person Account' ? 'PersonAccount.' + rec.DeveloperName : '';
                    let recTypes = personAccount != '' ? personAccount : objNameRecType;
                    let recTyperPer = (data.recordTypeVisibility && data.recordTypeVisibility[recTypes]) ? data.recordTypeVisibility[recTypes] : {
                        "RecordType": recTypes,
                        "Visible": false
                    };
                    return {
                        ...recTyperPer,
                        label: rec.Name,
                        developerName: rec.DeveloperName,
                    }
                }).sort((a, b) => {
                    if (a.Visible == b.Visible) {
                        return a.label.localeCompare(b.label);
                    }
                    return a.Visible ? -1 : 1;
                })
                this.recordTypes = uniqueRecType
                this.lastSavedRecType = JSON.parse(JSON.stringify(this.recordTypes));
                this.dispatchEvent(new CustomEvent("newrecpermissionforopendedobject", {
                    detail: JSON.parse(JSON.stringify(this.recordTypes)),
                    bubbles: true,
                    composed: true,
                }));
                this.showRecordType = this.recordTypes.length > 0 ? true : false;

            }).catch(error => {
                console.log('error : ', JSON.stringify(error));
                this.showSpinner = false;
            })
    }
    //This Method is used to search input event handler  
    handleSearchKeyChange = debounce((event) => {
        this.searchKey = event.target.value;
        this.filterRecordTypes();
    }, 300);
    //This getter funtion we handled search Record Type visibility in UI level.
    get filteredRecType() {
        if (this.searchKey) {
            return this.recordTypes.filter(rec => rec.label.toLowerCase().includes(this.searchKey.toLowerCase()));
        }
        return this.recordTypes;
    }
    //This Method is used to cancel and revert back the changes based on respective cancel buttons
    handleCancel(event) {
        if (event.target.name == 'rec cancel' || event.target.name == 'profile ok') {
            this.isEditRecTypeDisabled = true;
            this.isExistingPermissionSet = false;
            this.disableCreatePermissionSet = true;
            this.isEditRecTypeMode = false;
            this.isNewPermSet = false;
            this.recordTypes = JSON.parse(JSON.stringify(this.lastSavedRecType))
            this.showRecordType = this.recordTypes.length > 0 ? true : false;
            this.isSaveRecDisabled = true;
            this.changedRecordType = [];
            this.isRecPerSet = false;
            this.isRecDefPro = false;
            this.isRecPro = false;
            this.isModalOpen = false;
            this.profToPermSet = [];
        }
        if (event.target.name == 'profile cancel' || event.target.name == 'permission set cancel') {
            this.isRecPerSet = false;
            this.isRecDefPro = false;
            this.isRecPro = false;
            this.isModalOpen = false;
            this.profToPermSet = [];
        }
    }
    //This Method is used to Initiate to Edit Record Type Visibilities
    handleRecTypeEdit() {
        this.isEditRecTypeDisabled = false;
        this.isEditRecTypeMode = true;
    }
    //This Method is user to handle Record Type input changes
    handleRecTypePermChange(event) {
        this.isSaveRecDisabled = false;;
        this.recordTypes = this.recordTypes.map(recType => {
            if (recType.RecordType === event.target.dataset.name) {
                recType[event.target.name] = event.target.checked;
                if (this.enabledDefault) {
                    if (event.target.name === 'Default_x') {
                        if (event.target.checked) {
                            this.recordTypes.forEach(rt => {
                                if (rt.RecordType !== event.target.dataset.name) {
                                    rt.Default_x = false;
                                }
                            });
                            recType.Visible = true;
                        }
                    } else if (event.target.name === 'Visible' && !event.target.checked && recType.Default_x) {
                        recType.Default_x = false;
                    }
                }
                if (!this.changedRecordType.includes(recType)) {
                    this.changedRecordType.push(recType);
                }
            }
            return recType;
        });
    }
    //This Method is used to Initiate Record Type Change and alter data to made this changes to either New or Existing Permissionset.
    handleRecTypePermSave() {
        let hasDefault = this.recordTypes.some(recordType => recordType.Default_x === true);
        let hasDefaultField = this.recordTypes.some(recordType => 'Default_x' in recordType);
        if (this.changedRecordType.length > 0) {
            this.profToPermSet = this.changedRecordType.map(recType => {
                let selectedRecTypeLastSaved = this.lastSavedRecType.find(e => e.RecordType == recType.RecordType)
                if (selectedRecTypeLastSaved) {
                    if (selectedRecTypeLastSaved.Visible != recType.Visible && recType.Visible == true) {
                        let {
                            default_x,
                            ...filteredRecType
                        } = recType;
                        return filteredRecType;
                    }
                }
            }).filter(recType => recType)
        }
        this.disableCreatePermissionSet = this.profToPermSet.length > 0 ? false : true;
        if (hasDefault) {
            this.isModalOpen = true;
            this.isRecPro = true;
        } else if (!hasDefault && hasDefaultField) {
            this.isModalOpen = true;
            this.isRecDefPro = true;
        } else {
            this.isModalOpen = true;
            this.isRecPerSet = true;
        }

    }
    //This Helper Method is used to update the Record Type Visibility Directly on Profile/PermissionSet from server
    handleRecTypeHandler(recType, permName, permType) {
        this.showSpinner = true;
        updateRecordTypeVisibility({
                recordTypeVisibility: recType,
                profileOrPermSetNames: permName,
                profileOrPermissionSetType: permType
            })
            .then(res => {
                console.log('check rectype upsert result' + JSON.stringify(res));
                this.showSpinner = false;
                this.isShowSpinner = false;
                this.changedRecordType = [];
                this.isEditRecTypeDisabled = true;
                this.isEditRecTypeMode = false;
                this.isSaveRecDisabled = true
                this.profToPermSet = []
                this.showRecordType = true;
                this.recordTypes = this.recordTypes.map(recType => {
                    let updatedRecordType = res.find(updated => updated.RecordType === recType.RecordType);
                    return updatedRecordType ? updatedRecordType : recType;
                });
                this.lastSavedRecType = JSON.parse(JSON.stringify(this.recordTypes));
                this.dispatchEvent(new CustomEvent("newrecpermissionforopendedobject", {
                    detail: JSON.parse(JSON.stringify(this.recordTypes)),
                    bubbles: true,
                    composed: true,
                }));
                this.handleShowToast('RecordType updated Successfully', 'Success', 'success');
            })
            .catch(err => {
                console.log('check rectype upsert error' + JSON.stringify(err));
                this.showSpinner = false;
                this.isShowSpinner = false;
                this.changedRecordType = [];
                this.isEditRecTypeMode = false;
                this.isEditRecTypeDisabled = true;
                this.isSaveRecDisabled = true
                this.showRecordType = true;
                this.profToPermSet = []
                this.recordTypes = JSON.parse(JSON.stringify(this.lastSavedRecType));
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', err);
            })
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
    //This Method is used to initiate handleRecTypeHandler to update the record type visibilities.
    handleConfirm(event) {
        this.handleRecTypeHandler(this.changedRecordType, this.permName, this.permissionType);
        this.isModalOpen = false;
    }
    //This Method is used to cancel user list popup.
    handleUserCancel() {
        this.isUsersTable = false;
        this.isRecPro = this.previousTemplateState.isRecPro;
        this.isRecDefPro = this.previousTemplateState.isRecDefPro;
        this.isRecPerSet = this.previousTemplateState.isRecPerSet;
        this.previousTemplateState = {};
        this.isModalOpen = true;
    }
    //This Method is used to Open user list popup.
    handleOpenUserModal() {
        this.previousTemplateState = {
            isRecPro: this.isRecPro,
            isRecDefPro: this.isRecDefPro,
            isRecPerSet: this.isRecPerSet,
        };
        if (this.isRecPro == true) {
            this.isRecPro = false;
        }
        if (this.isRecDefPro == true) {
            this.isRecDefPro = false;
        }
        if (this.isRecPerSet == true) {
            this.isRecPerSet = false;
        }
        this.isModalOpen = false;
        this.isUsersTable = true;
        if (this.previousTemplateState.isRecPro || this.previousTemplateState.isRecDefPro) {
            this.isRecProHeading = true;
        } else if (this.previousTemplateState.isRecPerSet) {
            this.isRecPerSetHeading = true;
        }
    }
    //This Method is used to handle Existiong PermissionSet initiation
    handleExistingPermissionSet() {
        this.isExistingPermissionSet = true;
    }
    //This Method is used to handle Existiong PermissionSet cancel
    handleExistingCancel() {
        this.isExistingPermissionSet = false;
    }
    //This Method is used to handle update Permissionset which we make in profile 
    handleUpdateExistingPermissionSet(event) {
        this.isShowSpinner = true;
        let permSet = this.permSetList.find(e => e.Id == event.target.dataset.id);
        let selectedApiName = permSet.NamespacePrefix && permSet.NamespacePrefix != '' ? permSet.NamespacePrefix + '__' + permSet.Name : permSet.Name;
        updateRecordTypeVisibility({
                recordTypeVisibility: this.profToPermSet,
                profileOrPermSetNames: selectedApiName,
                profileOrPermissionSetType: 'PermissionSet'
            })
            .then(res => {
                this.isShowSpinner = false;
                this.handleShowToast(`Successfully updated RecordType in selected Permission set : ${permSet.Name}`, 'Success', 'success');
                this.resetChanges('rec cancel');

            }).catch(err => {
                this.isShowSpinner = false;
                this.resetChanges('rec cancel');
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', 'error')
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
        this.permSetList.push(event.detail);
        this.dispatchEvent(new CustomEvent("newpermissionsettoadd", {
            detail: event.detail,
            bubbles: true,
            composed: true,
        }));
    }
    //This Method is used to reset all the changes
    resetChanges() {
        this.isEditRecTypeDisabled = true;
        this.isExistingPermissionSet = false;
        this.disableCreatePermissionSet = true;
        this.isEditRecTypeMode = false;
        this.isNewPermSet = false;
        this.recordTypes = JSON.parse(JSON.stringify(this.lastSavedRecType))
        this.showRecordType = this.recordTypes.length > 0 ? true : false;
        this.isSaveRecDisabled = true;
        this.changedRecordType = [];
        this.isRecPerSet = false;
        this.isRecDefPro = false;
        this.isRecPro = false;
        this.isModalOpen = false;
        this.profToPermSet = [];
    }
    // Memoized filtering
    filterRecordTypes() {
        const cacheKey = this.searchKey.toLowerCase();
        if (this.recordTypeCache.has(cacheKey)) {
            this.filteredRecordTypes = this.recordTypeCache.get(cacheKey);
            return;
        }

        const filtered = this.recordTypes.filter(rec => 
            rec.label.toLowerCase().includes(cacheKey)
        );
        
        this.recordTypeCache.set(cacheKey, filtered);
        this.filteredRecordTypes = filtered;
        this.hasRecType = filtered.length > 0;
    }
    // Error handling
    handleError(error) {
        console.error('Record Type Error:', error);
        this.showErrorToast(this.extractErrorMessage(error));
        this.resetState();
    }
    // Improved state reset
    resetState(action) {
        this.state = {
            ...this.state,
            isEditing: false,
            loading: false
        };
        this.clearCaches();
        this.dispatchEvent(new CustomEvent('statereset'));
    }
    // Performance monitoring
    measureOperation(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }
}