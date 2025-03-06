//This Component is used to Create New PermissionSet Along with User/Object/Field/RecType/Tab Permissions if needed..
//This Component is used in PermissionAnalyzerObject, PermissionAnalyzerRecordType, UserPermissionAnalyzer, TabPermissionAnalyzer and ManagePermissionSetComponent
import { LightningElement,track,api} from 'lwc';
import duplicatePermissionSetCheck from '@salesforce/apex/ManagePermissionSetCreateServer.duplicatePermissionSetCheck';
import createNewPermissionSet from '@salesforce/apex/ManagePermissionSetCreateServer.createNewPermissionSet';
import getUserLicenseForUser from '@salesforce/apex/ManagePermissionSetCreateServer.getUserLicenseForUser';
import getUsersBasedOnLicenseName from '@salesforce/apex/ManagePermissionSetCreateServer.getUsersBasedOnLicenseName';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

// Add constants for better maintainability
const CONSTANTS = {
    DEBOUNCE_DELAY: 300,
    MAX_USERS: 1000,
    VALIDATION_MESSAGES: {
        REQUIRED: 'This field is required',
        INVALID_FORMAT: 'Invalid format'
    }
};

export default class ManagePermissionSetCreate extends LightningElement {
    isCreatePerSetClicked = true;
    createPermissionSetObj = {}
    combinedLicenseValue = [];
    isCreateDisabled = true;
    isCreatedNextforPermissionSet = false;
    @track searchtermforperset = '';
    @track usersLength = [];
    @track hasAvailUser = true;
    @track selectedusersLength = '1';
    @track selectedusers = [];
    isCreateSaveforPermissionSet = false;
    isUser = false;
    @track selectedIds = new Set();
    @track removedIds = new Set();
    @track selectedusersId = [];
    showSpinner = false;
    @api selectedUserId;
    @api changedObjPermissions;
    @api changedFieldPermissions;
    @api objectName;
    @api updateType;
    updatedPermissions = {};
    @api objectDependencies;
    @api updateTabList;
    @api updatedUser;
    @api updatedRecord;
    @api
    get updatedPerms() {
        return this.updatedPermissions;
    }
    set updatedPerms(value) {
        this.updatedPermissions = JSON.parse(JSON.stringify(value));
    }
    //From this connectedCallBack Method we get the selected user License.
    connectedCallback() {
        this.getLicense(this.selectedUserId);
    }
    //This getter funtion we handled search user in UI level.
    get filteredAvailableUser() {
        if (this.searchtermforperset) {
            const filtered = this.availableUsers.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforperset.toLowerCase()));
            this.hasAvailUser = filtered.length > 0;
            return filtered;
        } else {
            return this.availableUsers;
        }
    }
    //This CloseModal fire an CustomEvent to close this component
    closeModal() {
        this.dispatchEvent(new CustomEvent("closecreatepermset", {
            bubbles: true,
            composed: true,
        }));
    }
    //This Function will used to handle back Button as this component have 3 modal
    handleBackforPermissionSet() {
        this.isCreatePerSetClicked = true;
        this.isCreatedNextforPermissionSet = false;
        this.selectedusersLength = '1';
    }
    //This Function will used to handle Next Button for 1st Modal
    handleclickNextforPermissionSet() {
        this.isCreateSaveforPermissionSet = true;
        this.isCreatedNextforPermissionSet = false;
    }
    //This Function will used to handle to Close Next Modal 
    handleNextCloseModalforPermissionSet() {
        this.isCreatedNextforPermissionSet = true;
        this.isCreateSaveforPermissionSet = false;
        this.searchtermforperset = '';
        this.hasAvailUser = true;
    }
    //This method is used to handle the License field for new PermissionSet Creation
    handleLicenseChange(event) {
        this.createPermissionSetObj.License = event.target.value;
    }
    //This method is used to handle the hasActivationRequired field for new PermissionSet Creation
    handleSessionChange(event) {
        this.createPermissionSetObj.hasActivationRequired = event.target.checked;
    }
    //This Method is used to handle to search the users to assign for new PermissionSet Creation
    handleSearchAvailableUsers(event) {
        this.searchtermforperset = event.target.value;
        this.filteredAvailableUser;
    }
    //This Method is used to handle the Label API name and Description for new PermissionSet Creation
    handlePermissionSetFieldValue(event) {
        let field = event.target.dataset.id;
        let updatedPermissionSetObj = { ...this.createPermissionSetObj }; 
        if (field === 'label') {
            updatedPermissionSetObj.Label = event.target.value;
            updatedPermissionSetObj.Name = this.generateApiName(updatedPermissionSetObj.Label); 
            if(updatedPermissionSetObj.Lable != ''){
                this.isCreateDisabled = false;
            }else{
                this.isCreateDisabled = true;
            }  
        } else if (field === 'apiName') {
            updatedPermissionSetObj.Name = event.target.value.replace(/[^a-zA-Z0-9_]/g, '_');
        } else if (field === 'description') {
            updatedPermissionSetObj.Description = event.target.value;
        }
        this.createPermissionSetObj = updatedPermissionSetObj; 
    }
    //This Method is used to auto generate the API name based on Label Field
    generateApiName(label) {
        return label.includes(' ') ? label.replace(/[^a-zA-Z0-9_]/g, '_') : label;
    }
    //This Method is used to select the users in order to create permissionset along with Users
    handleSelectUserToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.selectedIds.has(userId)) {
            this.selectedIds.delete(userId);
        } else {
            this.selectedIds.add(userId);
        }
        this.updateHighlight();
    }
    //This Method is used to deselect the users.
    handleSelectUserToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedIds.has(userId)) {
            this.removedIds.delete(userId);
        } else {
            this.removedIds.add(userId);
        }
        this.updateHighlight();
    }
    //This Method is used to add the selected users for new PermissionSet Creation
    handleToAddSelectedUsersButton() {
        this.selectedIds.forEach(id => {
            const set = this.availableUsers.find(set => set.Id === id);
            if (set) {
                this.selectedusers = [...this.selectedusers, set];
                this.isUser = this.selectedusersLength > 0;
                this.selectedusersId = this.selectedusers.map(item => item.Id);
                this.selectedusersLength = this.selectedusersId.length;
                this.availableUsers = this.availableUsers.filter(item => item.Id !== id);
                this.selectedIds.delete(id);
            }
        });
        this.usersLength = this.availableUsers.length;
        this.updateHighlight();
        console.log('this.selectedusersId', JSON.stringify(this.selectedusersId));
    }
    //This Method is used to remove the selected users for new PermissionSet Creation
    handleToRemoveSelectedUsersButton() {
        this.removedIds.forEach(id => {
            const set = this.selectedusers.find(set => set.Id === id); 
            if (set) {
                this.availableUsers = [...this.availableUsers, set];
                this.usersLength = this.availableUsers.length;
                this.selectedusers = this.selectedusers.filter(item => item.Id !== id);
                this.selectedusersLength = this.selectedusers.length;
                this.removedIds.delete(id);
            }
        });
        this.selectedusersId = this.selectedusers.map(item => item.Id);
        this.selectedusersLength = this.selectedusersId.length;
        this.updateHighlight();
        console.log('this.selectedPermissionSetId', JSON.stringify(this.selectedusersId))
    }
    //This Method is used to Highlight selected Users to Add Or Remove
    updateHighlight() {
        this.template.querySelectorAll('.slds-grid').forEach(item => {
            item.classList.remove('selected-user');
        });
        this.selectedIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });
    }
    //This Method is handle Next button on 1st Modal
    handleNextforPermissionSet() {
        duplicatePermissionSetCheck({
        label: this.createPermissionSetObj.Label,
        apiName: this.createPermissionSetObj.Name
        })
        .then(exists => {
            this.showSpinner = false;
            if (exists) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'A Permission Set with the same Label or API Name already exists.',
                        variant: 'error'
                    })
                );
            } else {
                this.isCreatedNextforPermissionSet = true;
                this.isCreatePerSetClicked = false;
                this.getUsers(this.createPermissionSetObj.License);
            }
        })
        .catch(error => {
            this.showSpinner = false;
            console.error('Error checking Permission Set existence: ', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to check Permission Set existence. Please try again.',
                    variant: 'error'
                })
            );
        });
    }    
    //get user License based on users
    getLicense(userId) {
     getUserLicenseForUser({userId:userId})
        .then(result => {
            let userLicenses = result.UserLicense || [];
            let noneOptionLicense = {
                    label: 'None',
                    value: null
                };
            let permissionSetLicenses = result.PermissionSetLicense || [];
            const mapAndSort = (licenses) => licenses
                .map(item => ({ label: item.MasterLabel, value: item.Name }))
                .sort((a, b) => a.label.localeCompare(b.label));
            this.combinedLicenseValue = [
                ...mapAndSort(userLicenses),
                ...mapAndSort(permissionSetLicenses)
            ];
            this.createPermissionSetObj.License = noneOptionLicense.value;
        })
        .catch(error => {
            console.error('Error retrieving licenses', error);
        });
    }
    //This Method is used to get the Other Users Based on License if license is selected
    getUsers(licensename) {
        getUsersBasedOnLicenseName({licenseName: licensename})
            .then(res => {
                this.selectedIds.add(this.selectedUserId);
                this.selectedusersId = this.selectedUserId;
                this.selectedusers = res
                .filter(result => this.selectedUserId === result.Id) 
                .map(result => {
                    return {
                        ...result,
                        profileName: result.Profile?.Name,
                        userLicense: result.Profile?.UserLicense?.Name
                    };
                });
                this.availableUsers = res
                .map(result => {
                    if (this.selectedUserId !== result.Id) {
                        return {
                            ...result,
                            profileName: result.Profile?.Name,
                            userLicense: result.Profile?.UserLicense?.Name
                        };
                    }
                    return null; 
                })
                .filter(user => user !== null);
                this.usersLength = res.length;
                this.showSpinner = false;
            })
            .catch(err=>{
            console.log('err >> ', JSON.stringify(err))
           })
    }
    //This Method is to call Server to create new Permissionset based on Obj,Tab,User and RecordType
    handleCreateforPerSet(){
        this.showSpinner = true;
        if(this.updateType == 'Obj'){
            this.handleObjCreate();
        }
        if(this.updateType == 'Field'){
            this.handleFieldCreate();
        }
        if(this.updateType == 'Tab'){
            this.createPermSet(this.createPermissionSetObj, this.selectedusersId,{},[],'',this.updateType,JSON.stringify(this.updateTabList),{},[]);
        }
        if(this.updateType == 'User'){
            this.createPermSet(this.createPermissionSetObj, this.selectedusersId,{},[],'',this.updateType,'',this.updatedUser,[]);
        }
        if(this.updateType == 'RecordType'){
            this.createPermSet(this.createPermissionSetObj, this.selectedusersId,{},[],'',this.updateType,'',{},this.updatedRecord); 
        }
    }
    //This Method is helper Method to handle Server Call for creating PermissionSet
    createPermSet(newPermSet,userIds,objectPermissionsMap,fieldPerms,objName,updateType,tabToUpdate,userToUpdate,recTypeToUpdate){

        createNewPermissionSet({newPermSet:newPermSet,userIds:userIds,objectPermissionsMap:objectPermissionsMap,fieldPerms:fieldPerms,objName:objName,updateType:updateType,tabToUpdate:tabToUpdate,userToUpdate:userToUpdate,recTypeToUpdate:recTypeToUpdate}) 
        .then(res=>{
        console.log('check create res', JSON.stringify(res));
            this.showSpinner =false
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'New PermissionSet created Successfully.',
                variant: 'success'
            })
            );
            this.dispatchEvent(new CustomEvent("newcreatedpermset", {
                detail: res,
                bubbles: true,
                composed: true,
            }));

        })
        .catch(err=>{
        this.showSpinner =false 
        console.log('err >> ', JSON.stringify(err))
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: err.body.message,
                variant: 'error'
            })
        );
        })
    }
    //Helper Method for Create Permissionset for Object Permissions as object has dependencies
    handleObjCreate(){
        let changedExistingPermissions = {existingObjPermissions : {}, existingFieldpermissions : [] }
        if(this.changedObjPermissions){
                const relatedPermissionsCheckMap = {
                    PermissionsRead: ['PermissionsRead'],
                    PermissionsEdit: ['PermissionsRead', 'PermissionsEdit'],
                    PermissionsDelete: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete'],
                    PermissionsCreate: ['PermissionsRead', 'PermissionsCreate'],
                    PermissionsViewAllRecords: ['PermissionsRead', 'PermissionsViewAllRecords'],
                    PermissionsModifyAllRecords: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete', 'PermissionsViewAllRecords', 'PermissionsModifyAllRecords']
                };
            if(this.changedObjPermissions && Object.keys(this.changedObjPermissions).length > 0){
                for(let permission in relatedPermissionsCheckMap){
                    if(this.updatedPermissions['objChange'][this.objectName][permission]){
                        relatedPermissionsCheckMap[permission].forEach(relatedPerms=>{
                            this.updatedPermissions['objChange'][this.objectName][relatedPerms] = true;
                        })
                    }
                }
                let uniqueObjName = new Set();
                this.objectName
                if(this.updatedPermissions['objChange'] && this.objectDependencies.length > 0){
                    uniqueObjName.add(this.objectName);
                    const findRequiredObjects = (currentObjName) => {
                        let foundNewObject = false;                
                        this.objectDependencies.forEach(({ Permission, RequiredPermission }) => {
                            const [objName, permType] = Permission.split('<');
                            const [reqObjName, reqPermType] = RequiredPermission.split('<');
                            let permTypeChange = 'Permissions' + permType.replace('>', '').replace(/^./, str => str.toUpperCase());
                            let reqPermTypeChange = 'Permissions' + reqPermType.replace('>', '').replace(/^./, str => str.toUpperCase());
                            if (objName === currentObjName && this.updatedPermissions['objChange'][currentObjName][permTypeChange]) {
                            if (!this.updatedPermissions['objChange'][reqObjName]) {
                                this.updatedPermissions['objChange'][reqObjName] = {};
                            }
                            this.updatedPermissions['objChange'][reqObjName][reqPermTypeChange] = true;
                            if(!uniqueObjName.has(reqObjName)){
                                uniqueObjName.add(reqObjName);  
                                foundNewObject = true;
                            }
                            }
                        });                        
                        return foundNewObject;
                    };
                    // Start checking with objNameFromParent
                    let currentObjName = this.objectName;
                    while (findRequiredObjects(currentObjName)) {
                        currentObjName = Array.from(uniqueObjName).pop();
                    }                     
                }
                if(Array.from(uniqueObjName).length >0){
                    Array.from(uniqueObjName).forEach(objName=>{
                        changedExistingPermissions['existingObjPermissions'][objName] = {PermissionsCreate:false,PermissionsRead:false,PermissionsDelete:false,PermissionsEdit:false,PermissionsViewAllRecords:false,PermissionsModifyAllRecords:false}
                    })
                }
            }
            if(this.updatedPermissions['objChange']){
                Object.keys(this.updatedPermissions['objChange']).forEach(objectName=>{
                    if (changedExistingPermissions['existingObjPermissions'][objectName]) {
                        Object.keys(this.updatedPermissions['objChange'][objectName]).forEach(permissionKey=>{
                            relatedPermissionsCheckMap[permissionKey].forEach(relatedPermission => {
                                changedExistingPermissions['existingObjPermissions'][objectName][relatedPermission] = true;
                            });
                        })
                    }
                })
            }
            this.createPermSet(this.createPermissionSetObj,this.selectedusersId,changedExistingPermissions['existingObjPermissions'],[],this.objectName,this.updateType,'',{},[]);
        }
    }
    //Helper Method for create permissionset for field permissions
    handleFieldCreate(){
       let changedExistingPermissions = [];
        const relatedPermissionsCheckMap = {
            PermissionsRead: ['PermissionsRead'],
            PermissionsEdit: ['PermissionsRead', 'PermissionsEdit'],
            PermissionsDelete: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete'],
            PermissionsCreate: ['PermissionsRead', 'PermissionsCreate'],
            PermissionsViewAllRecords: ['PermissionsRead', 'PermissionsViewAllRecords'],
            PermissionsModifyAllRecords: ['PermissionsRead', 'PermissionsEdit', 'PermissionsDelete', 'PermissionsViewAllRecords', 'PermissionsModifyAllRecords']
        };
       if(this.changedFieldPermissions.length > 0){
            changedExistingPermissions = this.changedFieldPermissions.map(changedFields=>{
                return{
                    ...changedFields,
                PermissionsRead :false,
                PermissionsEdit :false,
                }                    
            })
        }
        if(this.updatedPermissions['fieldChange'] && changedExistingPermissions.length > 0){
            changedExistingPermissions.forEach(fieldPerm=>{
                if(this.updatedPermissions['fieldChange'][fieldPerm.Field]){
                    Object.keys(this.updatedPermissions['fieldChange'][fieldPerm.Field]).forEach(permissionKey=>{
                        relatedPermissionsCheckMap[permissionKey].forEach(relatedPermission => {
                            fieldPerm[relatedPermission] = true;
                        });
                    })
                }
            })            
        }
        this.createPermSet(this.createPermissionSetObj,this.selectedusersId,{},changedExistingPermissions,this.objectName,this.updateType,'',{},[]);
    }

    // Use private fields for better encapsulation
    #searchTimeout;
    #selectedUsers = new Set();

    // Improve state management
    @track state = {
        ui: {
            isLoading: false,
            currentStep: 1,
            showError: false
        },
        form: {
            label: '',
            apiName: '',
            description: ''
        }
    };

    // Add debouncing for search
    handleSearchUsers(event) {
        clearTimeout(this.#searchTimeout);
        this.#searchTimeout = setTimeout(() => {
            this.searchUsers(event.target.value);
        }, CONSTANTS.DEBOUNCE_DELAY);
    }

    // Add proper validation
    validateForm() {
        const form = this.template.querySelector('form');
        const isValid = [...form.elements].every(element => {
            if (element.required) {
                const isValidInput = element.reportValidity();
                return isValidInput;
            }
            return true;
        });
        return isValid;
    }

    // Improve error handling
    @api
    async handleSubmit(event) {
        try {
            event.preventDefault();
            if (!this.validateForm()) {
                return;
            }

            this.state.ui.isLoading = true;
            await this.createPermissionSet();
            this.showSuccessToast('Permission Set created successfully');
        } catch (error) {
            this.handleError(error);
        } finally {
            this.state.ui.isLoading = false;
        }
    }

    // Add proper user selection handling
    handleUserSelection(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.#selectedUsers.has(userId)) {
            this.#selectedUsers.delete(userId);
        } else {
            if (this.#selectedUsers.size < CONSTANTS.MAX_USERS) {
                this.#selectedUsers.add(userId);
            } else {
                this.showWarningToast('Maximum user limit reached');
            }
        }
        this.updateSelectedUsers();
    }
}