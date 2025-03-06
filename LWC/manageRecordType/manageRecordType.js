//This Component is used to handle RecordType Visibility for Profile and PermissionSet.
//This component is used in manageProfileComponent & managePermissionSetComponent.
import {LightningElement,wire,api,track} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getRecTypeVisibilityForProfileAndPermSet from '@salesforce/apex/PermissionAnalyzerRecordTypeServer.getRecTypeVisibilityForProfileAndPermSet';
import updateRecordTypeVisibility from '@salesforce/apex/PermissionAnalyzerRecordTypeServer.updateRecordTypeVisibility';
export default class ManageRecordType extends LightningElement {
    @api enableRecordTypeEdit;
    @api permSetId;
    @api objectName;
    @api enabledDefault;
    isSaveRecDisabled = true;
    isEditRecTypeDisabled = true;
    isEditRecTypeMode = false
    @track showSpinner = true
    @track recordTypes = [];
    @track changedRecordType = [];
    @track lastSavedRecType = [];
    showRecordType = false;
    @track searchKey = '';
    @track hasRecType = true;
    @api permissionType;
    @track uservalue;
    @track userValueLength;
    isModalOpen = false;
    isRecPro = false;
    isRecDefPro = false;
    isRecPerSet = false;
    @api permName;
    @api totalUser;
    @api profName;

    // Group related state
    @track recordTypeState = {
        types: [],
        selected: new Set(),
        lastSaved: []
    };

    // Debounced search
    searchDebounceTimeout;

    connectedCallback() {
        this.getRecTypeVisibilityHelper();
    }
    //This method retrieves and processes record type visibility data based on parameters, sorts the record types, and updates the UI accordingly.
    getRecTypeVisibilityHelper(){
        getRecTypeVisibilityForProfileAndPermSet({objName:this.objectName,permissionSetId:this.permSetId,profileOrPermissionSetType:this.permissionType,profileOrPermSetName:this.permName})
        .then(res=>{
            console.log('res : ', JSON.stringify(res))
            this.showSpinner = false;
            let uniqueRecType = res.recordTypeList.map(rec => {
                let objNameRecType = rec.NamespacePrefix == null ? this.objectName + '.' + rec.DeveloperName : this.objectName + '.' + rec.NamespacePrefix + '__' + rec.DeveloperName;
                let personAccount = rec.Name == 'Person Account' ? 'PersonAccount.' + rec.DeveloperName : '';
                let recTypes = personAccount != '' ? personAccount : objNameRecType;
                let recTyperPer = (res.recordTypeVisibility && res.recordTypeVisibility[recTypes]) ? res.recordTypeVisibility[recTypes] : {
                    "RecordType": recTypes,
                    "Visible": false
                };
                console.log('recTypePer>>> ', recTyperPer);
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
            this.showRecordType = this.recordTypes.length > 0 ? true : false;
        }).catch(error=>{
            console.log('error : ', JSON.stringify(error));
            this.showSpinner = false;
        })
    }

    //This method fetches and processes user profile data, updating the user information and visibility of user details based on the results.
    handleProfileChange(profsetid) {
        getUserProfilePerSet({
                profpersetId: profsetid
            })
            .then((result) => {
                console.log('result', result);
                this.uservalue = result.map(res => {
                    return {
                        Name: res.Assignee?.Name,
                        Username: res.Assignee?.Username,
                        isActive: res.Assignee?.IsActive,
                        licenseName: res.Assignee?.Profile?.UserLicense?.Name
                    };
                });
                this.userValueLength = this.uservalue.length;
                this.showUsers = this.uservalue.length > 0 ? true : false;
            })
            .catch((error) => {
                console.error('Error fetching profile details:', JSON.stringify(error));
                this.showSpinner = false;
            });
    }
    //This function updates the search key and sets the visibility of record types based on the filtered results.
    handleSearchKeyChange(event) {
        clearTimeout(this.searchDebounceTimeout);
        this.searchDebounceTimeout = setTimeout(() => {
            this.searchKey = event.target.value;
            this.filterRecordTypes();
        }, 300);
    }
    //This getter method function is for searching Record type permissions in UI.
    get filteredRecordTypes() {
        const searchTerm = this.searchKey.toLowerCase();
        if (this.filteredRecordTypesMemo?.searchTerm === searchTerm) {
            return this.filteredRecordTypesMemo.results;
        }
        
        const results = this.recordTypes.filter(rec => 
            rec.label.toLowerCase().includes(searchTerm)
        );
        
        this.filteredRecordTypesMemo = {
            searchTerm,
            results
        };
        
        return results;
    }
    //This function resets the record type changes, disables edit modes, and closes the modal while restoring the original record types.
    handleCancel() {
        this.isEditRecTypeDisabled = true;
        this.isEditRecTypeMode = false;
        this.recordTypes = JSON.parse(JSON.stringify(this.lastSavedRecType))
        this.showRecordType = this.recordTypes.length > 0 ? true : false;
        this.isSaveRecDisabled = true;
        this.changedRecordType = [];
        this.isRecPerSet = false;
        this.isRecDefPro = false;
        this.isRecPro = false;
        this.isModalOpen = false;
    }
    //This function enables the record type edit mode by setting flags for editing and mode status.
    handleRecTypeEdit() {
        this.isEditRecTypeDisabled = false;
        this.isEditRecTypeMode = true;
    }
    //This method updates the record type permissions based on user input, manages the default visibility, and tracks changes for saving.
    handleRecTypePermChange(event) {
        this.isSaveRecDisabled = false;
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
    //This method checks for default record type settingsand saving changes based on user selection and conditions.
    async handleRecTypePermSave() {
        let hasDefault = this.recordTypes.some(recordType => recordType.Default_x === true);
        let hasDefaultField = this.recordTypes.some(recordType => 'Default_x' in recordType);
        if (hasDefault) {
            if (this.totalUser > 0) {
                this.isModalOpen = true;
                this.isRecPro = true;
            } else {
                this.handleRecTypeHandler(this.changedRecordType, this.permName, this.permissionType);
            }
        } else if (!hasDefault && hasDefaultField) {
            this.isModalOpen = true;
            this.isRecDefPro = true;
        } else {
            if (this.totalUser > 0) {
                this.isModalOpen = true;
                this.isRecPerSet = true;
            } else {
                this.handleRecTypeHandler(this.changedRecordType, this.permName, this.permissionType);
            }
        }
    }
    //Halper method to update record type visibility.
    async handleRecTypeHandler(recType, permName, permType) {
        try {
            this.showSpinner = true;
            const result = await updateRecordTypeVisibility({
                recordTypeVisibility: recType,
                profileOrPermSetNames: permName,
                profileOrPermissionSetType: permType
            });
            
            this.handleSuccess(result);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.showSpinner = false;
        }
    }
    //This function dispatches a toast notification with the specified message, title, variant, and dismissible mode.
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
    //This function handles confirmation events for "profile record" and "permission set" by calling handleRecTypeHandler and closing the modal.
    handleConfirm(event) {
        if (event.target.name == 'profile record confirm') {
            this.handleRecTypeHandler(this.changedRecordType, this.permName, this.permissionType);
            this.isModalOpen = false;
        }
        if (event.target.name == 'permission set confirm') {
            this.handleRecTypeHandler(this.changedRecordType, this.permName, this.permissionType);
            this.isModalOpen = false;
        }
    }

    // Centralized error handling
    handleError(error) {
        const message = this.extractErrorMessage(error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }

    // Utility method for error message extraction
    extractErrorMessage(error) {
        const errorMessage = error.body?.message || error.message || 'Unknown error';
        return errorMessage.includes('first error:') 
            ? errorMessage.split('first error:')[1].trim() 
            : errorMessage;
    }
}