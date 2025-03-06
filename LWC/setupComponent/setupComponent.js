import {LightningElement,wire,track} from 'lwc';
import createApp from '@salesforce/apex/ConnectedAppCreation.createApp';
import checkConnectedAppAvailability from '@salesforce/apex/ConnectedAppCreation.getUserAccessConnectedApp';
import {subscribe,onError} from 'lightning/empApi';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getConnectedAssignment from '@salesforce/apex/ManageCloneUser.getConnectedAssignment';
import getConnectedAppId from '@salesforce/apex/ManageCloneUser.getConnectedAppId';
import assignAssignmentsConnectedApp from '@salesforce/apex/ConnectedAppCreation.assignAssignmentsConnectedApp';
import getUserAccessCredentialNamespace from '@salesforce/apex/UserAccessManager.getUserAccessCredentialNamespace';
import {refreshApex} from '@salesforce/apex';
import { publish, MessageContext } from 'lightning/messageService';
import THEME_CHANNEL from '@salesforce/messageChannel/ThemeChannel__c';
import { debounce } from 'c/utils';

export default class SetupComponent extends LightningElement {
    message;
    @track events = [];
    subscription = {};
    channelName;
    nameSpace;
    recordsExist = true;
    showModal = false;
    isEdit = true;
    @track wiredResult = [];
    showSpinner = false;
    @track availableProfile = [];
    @track originalAvailableProfileIds = new Set();
    @track availableProfileLength = 0;
    @track hasAvailProfile = true;
    @track originalSelectedProfileIds = new Set();
    connectedAppId;
    @track availablePermissionSets = [];
    @track originalAvailablePermissionSetIds = new Set();
    @track availablePermissionSetsLength = 0;
    @track hasAvailPermissionSet = true;
    @track originalSelectedPermissionSetIds = new Set();

    @track searchtermforperset = '';
    @track searchTermProfile = '';

    @track selectedProfileLength = 0;
    @track selectedPermissionSetsLength = 0;

    @track isSave = true;

    @track selectedPermissionSets = [];
    @track selectedProfiles = [];

    @track selectedPermissionSetIds = new Set();
    @track removedPermissionSetIds = new Set();

    @track selectedProfileIds = new Set();
    @track removedProfileIds = new Set();

    @track selectedPermissionSetId = [];
    @track selectedProfileId = [];

    @track permissionSetIds = [];
    @track isConnectDes;

    themeColor = localStorage.getItem('themeColor') || '#0070d2';

    @wire(MessageContext)
    messageContext;

    // State management
    @track state = {
        profiles: new Map(),
        permissionSets: new Map(),
        loading: false,
        error: null
    };

    // Debounced search handlers
    handleSearchAvailableProfile = debounce((event) => {
        this.filterProfiles(event.target.value);
    }, 300);

    handleSearchAvailablePerSet = debounce((event) => {
        this.filterPermissionSets(event.target.value);
    }, 300);

    // Memoized filtering
    filterProfiles(searchTerm) {
        const cacheKey = searchTerm.toLowerCase();
        if (this.state.profiles.has(cacheKey)) {
            this.filteredAvailableProfile = this.state.profiles.get(cacheKey);
            return;
        }

        const filtered = this.availableProfile.filter(profile => 
            profile.name.toLowerCase().includes(cacheKey)
        );

        this.state.profiles.set(cacheKey, filtered);
        this.filteredAvailableProfile = filtered;
        this.hasAvailProfile = filtered.length > 0;
    }

    // Error boundary
    handleError(error) {
        console.error('Setup Component Error:', error);
        this.showErrorToast(error);
        this.resetState();
    }

    // Performance monitoring
    measureOperation(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }

    // Lifecycle optimization
    disconnectedCallback() {
        this.clearCaches();
        this.unsubscribeFromEvents();
    }

    // Add getter for initial theme style
    get initialThemeStyle() {
        return `--theme-color: ${this.themeColor}`;
    }

    //This method initializes when the component loads
    connectedCallback() {
        this.getConnectedId();
        this.fetchNamespace();
        
        // Get stored color or use default
        const storedColor = localStorage.getItem('themeColor') || '#0070d2';
        this.themeColor = storedColor;
        
        // Apply theme color immediately
        this.updateThemeColors(this.themeColor);
        
        // Set SLDS brand color
        document.documentElement.style.setProperty('--lwc-brandPrimary', this.themeColor);
    }
    //The @wire function fetches profiles and permission sets 
    @wire(getConnectedAssignment, {connectedAppId: '$connectedAppId'})
    wiredConnectedAssignment(result) {
        this.wiredResult = result;
        const {data,error} = result;
        if (data) {
            console.log('Inside if data : ', JSON.stringify(data));
            this.availableProfile = data.profiles.map(profile => ({
                id: profile.Id,
                name: profile.Profile?.Name
            }));
            this.availablePermissionSets = data.permissionSets;
            this.selectedProfiles = data.assignedProfile.map(profile => ({
                id: profile.Id,
                name: profile.Profile?.Name
            }));
            this.selectedPermissionSets = data.assignedPermissionSet;

            this.originalAvailableProfileIds = new Set(this.availableProfile.map(set => set.id));
            this.originalAvailablePermissionSetIds = new Set(this.availablePermissionSets.map(set => set.Id));
            this.originalSelectedProfileIds = new Set(this.selectedProfiles.map(set => set.id));
            this.originalSelectedPermissionSetIds = new Set(this.selectedPermissionSets.map(set => set.Id));

            this.availableProfileLength = this.availableProfile.length;
            this.availablePermissionSetsLength = this.availablePermissionSets.length;
            this.selectedProfileLength = this.selectedProfiles.length;
            this.selectedPermissionSetsLength = this.selectedPermissionSets.length;

            this.hasAvailProfile = this.availableProfile.length > 0;
            this.hasAvailPermissionSet = this.availablePermissionSets.length > 0;

            this.showSpinner = false;
        } else if (error) {
            console.error('Error fetching permission sets:', error);
            this.showSpinner = false;
        }
    }

    //This method retrieves the ID of the connected app.
    getConnectedId() {
        getConnectedAppId()
            .then((result) => {
                this.connectedAppId = result;
                console.log('Connected App Id:', this.connectedAppId);
                this.checkRecords();
            })
            .catch((error) => {
                console.error('Error fetching Connected App Id:', error);
            });

    }

    fetchNamespace() {
        getUserAccessCredentialNamespace()
            .then((result) => {
                this.nameSpace = result || '';
                if (result) {
                    this.channelName = `/event/userTracker__ConnectedAppEvent__e`;
                } else {
                    this.channelName = '/event/ConnectedAppEvent__e';
                }
                console.log('Channel Name:', this.channelName);
            })
            .catch((error) => {
                console.error('Error retrieving namespace:', error);
            });
    }

    //The getter filters Profile based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailableProfile() {
        if (this.searchTermProfile) {
            const filtered = this.availableProfile.filter(obj => obj.name.toLowerCase().includes(this.searchTermProfile.toLowerCase()));
            this.hasAvailProfile = filtered.length > 0;
            return filtered;
        } else {
            return this.availableProfile;
        }
    }
    //This method updates the searchTermProfile with the input value from the event, triggering the filtering of available profile.
    handleSearchAvailableProfile(event) {
        this.searchTermProfile = event.target.value;
        this.filteredAvailableProfile;
    }

    //The getter filters Profile based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailablePerSet() {
        if (this.searchtermforperset) {
            const filtered = this.availablePermissionSets.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforperset.toLowerCase()));
            this.hasAvailPermissionSet = filtered.length > 0;
            return filtered;
        } else {
            return this.availablePermissionSets;
        }
    }
    //This method updates the searchtermforperset with the input value from the event, triggering the filtering of available permission sets.
    handleSearchAvailablePerSet(event) {
        this.searchtermforperset = event.target.value;
        this.filteredAvailablePerSet;
    }
    // This method is used to create a connected app.
    handleButtonClick() {
        this.isEdit = true;
        this.recordsExist = true;
        this.showSpinner = true;
        this.subscribeToEvent();
        createApp({connectedId : this.connectedAppId})
            .then(result => {
                this.message = result;
                if (!result.startsWith('Error:')) {
                    this.showToast('Please wait', this.message, 'info');
                }
            })
            .catch(error => {
                this.message = 'Error: ' + error.body.message;
                const toastEvent = new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to create application: ' + error.body.message,
                    variant: 'error'
                });
                this.dispatchEvent(toastEvent);
                this.recordsExist = false;
                this.isEdit = true;
                this.isConnectDes = true;
            });
    }
    //This method is used to check the existence of a connected app
    checkRecords() {
        checkConnectedAppAvailability({ connectedId: this.connectedAppId })
            .then((result) => {
                this.recordsExist = result;
                console.log('OUTPUT : recordsExist', JSON.stringify(this.recordsExist));
                this.isEdit = !this.recordsExist;
                console.log('Is Edit >>> ', this.isEdit);
                this.isConnectDes = !this.recordsExist;
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
    //This method is used to open a modal when the button is clicked.
    handleEditClick() {
        // Reset all selection sets and arrays when opening modal
        this.selectedPermissionSetIds = new Set();
        this.removedPermissionSetIds = new Set();
        this.selectedProfileIds = new Set();
        this.removedProfileIds = new Set();
        this.selectedPermissionSetId = [];
        this.selectedProfileId = [];
        this.permissionSetIds = [];
        this.isSave = true;
        
        // Remove any existing highlights
        this.template.querySelectorAll('.selected-user').forEach(item => {
            item.classList.remove('selected-user');
        });
        
        // Ensure modal gets correct theme when opening
        this.updateThemeColors(this.themeColor);
        
        this.showModal = true;
    }
    //This method used to close the modal 
    closeModal() {
        // Clear all selections
        this.selectedPermissionSetIds = new Set();
        this.removedPermissionSetIds = new Set();
        this.selectedProfileIds = new Set();
        this.removedProfileIds = new Set();
        this.selectedPermissionSetId = [];
        this.selectedProfileId = [];
        this.permissionSetIds = [];
        this.isSave = true;
        
        // Remove any existing highlights
        this.template.querySelectorAll('.selected-user').forEach(item => {
            item.classList.remove('selected-user');
        });
        
        // Reset search terms
        this.searchtermforperset = '';
        this.searchTermProfile = '';
        
        this.showModal = false;
    }
    //This method used to save the profile and permission set to the connected app
    handleSave() {
        this.showModal = false;
        this.showSpinner = true;
        assignAssignmentsConnectedApp({
                connectedAppId: this.connectedAppId,
                permissionSetIds: this.permissionSetIds
            })
            .then(result => {
                this.permissionSetIds = [];
                this.showSpinner = false;
                this.isSave = true;
                const toastEvent = new ShowToastEvent({
                    title: 'Success',
                    message: 'Successfully Assigned',
                    variant: 'success'
                });
                this.dispatchEvent(toastEvent);
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.permissionSetIds = [];
                this.showSpinner = false;
                this.isSave = true;
                console.log('Error updating permission sets:', JSON.stringify(error));
                const toastEvent = new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to assign : ' + error.body.message,
                    variant: 'error'
                });
                this.dispatchEvent(toastEvent);
            })
    }

    //The method updates the UI by adding or removing the selected-user CSS class to elements based on the current selection or removal state for permission sets, groups, public groups, and queues.
    updateHighlight() {
        // First clear all existing highlights
        this.template.querySelectorAll('.slds-grid').forEach(item => {
            item.classList.remove('selected-user');
        });

        // Only add highlights for current selections
        this.selectedProfileIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.profile-item[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        
        this.removedProfileIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.selected-profile[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });
        
        this.selectedPermissionSetIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.permission-item[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        
        this.removedPermissionSetIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.selected-permissionset[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });
    }

    //This method used for the selection of a profile ID 
    handleSelectProfileToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        // Clear other selections first
        this.selectedPermissionSetIds.clear();
        this.removedPermissionSetIds.clear();
        
        if (this.selectedProfileIds.has(userId)) {
            this.selectedProfileIds.delete(userId);
        } else {
            this.selectedProfileIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method toggles the removal state of a profile ID
    handleSelectProfileToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        console.log('OUTPUT : userId', JSON.stringify(userId));
        if (this.removedProfileIds.has(userId)) {
            this.removedProfileIds.delete(userId);
        } else {
            this.removedProfileIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method moves selected profile from the available list to the selected list
    handleToAddSelectedProfileButton() {
        this.selectedProfileIds.forEach(id => {
            const set = this.availableProfile.find(set => set.id === id);
            if (set) {
                this.selectedProfiles = [...this.selectedProfiles, set];
                if (this.originalAvailableProfileIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.selectedProfileId = this.selectedProfiles.map(item => item.id);
                this.selectedProfileLength = this.selectedProfileId.length;
                this.availableProfile = this.availableProfile.filter(item => item.id !== id);
                this.selectedProfileIds.delete(id);
            }
        });
        this.availableProfileLength = this.availableProfile.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }

    //This Method is used to remove the selected ids for new Permission Set Creation
    handleToRemoveSelectedProfileButton() {
        this.removedProfileIds.forEach(id => {
            const set = this.selectedProfiles.find(set => set.id === id);
            if (set) {
                if (this.originalSelectedProfileIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.availableProfile = [...this.availableProfile, set];
                this.availableProfileLength = this.availableProfile.length;
                this.selectedProfiles = this.selectedProfiles.filter(item => item.id !== id);
                this.selectedProfileLength = this.selectedProfiles.length;
                this.removedProfileIds.delete(id);
            }
        });
        this.selectedProfileId = this.selectedProfiles.map(item => item.id);
        this.selectedProfileLength = this.selectedProfileId.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }

    //This method used for the selection of a permission set ID 
    handleSelectPermissionSetToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        // Clear other selections first
        this.selectedProfileIds.clear();
        this.removedProfileIds.clear();
        
        if (this.selectedPermissionSetIds.has(userId)) {
            this.selectedPermissionSetIds.delete(userId);
        } else {
            this.selectedPermissionSetIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method toggles the removal state of a permission set ID
    handleSelectPermissionSetToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedPermissionSetIds.has(userId)) {
            this.removedPermissionSetIds.delete(userId);
        } else {
            this.removedPermissionSetIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method moves selected permission sets from the available list to the selected list
    handleToAddSelectedPermissionSetButton() {
        this.selectedPermissionSetIds.forEach(id => {
            const set = this.availablePermissionSets.find(set => set.Id === id);
            if (set) {
                this.selectedPermissionSets = [...this.selectedPermissionSets, set];
                if (this.originalAvailablePermissionSetIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.selectedPermissionSetId = this.selectedPermissionSets.map(item => item.Id);
                this.selectedPermissionSetsLength = this.selectedPermissionSetId.length;
                this.availablePermissionSets = this.availablePermissionSets.filter(item => item.Id !== id);
                this.selectedPermissionSetIds.delete(id);
            }
        });
        this.availablePermissionSetsLength = this.availablePermissionSets.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }

    //This Method is used to remove the selected ids for new Permission Set Creation
    handleToRemoveSelectedPermissionSetButton() {
        this.removedPermissionSetIds.forEach(id => {
            const set = this.selectedPermissionSets.find(set => set.Id === id);
            if (set) {
                if (this.originalSelectedPermissionSetIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.availablePermissionSets = [...this.availablePermissionSets, set];
                this.availablePermissionSetsLength = this.availablePermissionSets.length;
                this.selectedPermissionSets = this.selectedPermissionSets.filter(item => item.Id !== id);
                this.selectedPermissionSetsLength = this.selectedPermissionSetId.length;
                this.removedPermissionSetIds.delete(id);
            }
        });
        this.selectedPermissionSetId = this.selectedPermissionSets.map(item => item.Id);
        this.selectedPermissionSetsLength = this.selectedPermissionSetId.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }
    //This method subscribes to a platform event, processes the event data to update the connectedAppId, displays a toast message based on the event status, and updates the component state with the event information.
    subscribeToEvent() {
        console.log('subscribeToEvent Called');
        const messageCallback = (response) => {
            console.log('Received platform event:', response);
            const event = response.data.payload;
            let resultNamespace = this.nameSpace ? this.nameSpace : '';
            this.connectedAppId = resultNamespace ? event.userTracker__ConnectedApp_Id__c: event.ConnectedApp_Id__c;
            console.log('OUTPUT :connectedAppId ',JSON.stringify(this.connectedAppId));
            const isSuccess = resultNamespace ? event.userTracker__Status__c === 'Success' : event.Status__c === 'Success';
            const toastEvent = new ShowToastEvent({
                title: resultNamespace
                    ? (event.userTracker__Status__c === 'Success' ? 'Success' : 'Error')
                    : (event.Status__c === 'Success' ? 'Success' : 'Error'),
                message: resultNamespace
                    ? event.userTracker__Message__c
                    : event.Message__c,
                variant: resultNamespace
                    ? (event.userTracker__Status__c === 'Success' ? 'success' : 'error')
                    : (event.Status__c === 'Success' ? 'success' : 'error'),
            });
            if (isSuccess) {
                console.log('Operation was successful!');
                this.isEdit = false;
                this.recordsExist = true;
                this.isConnectDes = false;
            } else {
                console.log('An error occurred.');
                this.isEdit = true;
                this.recordsExist = false;
                this.isConnectDes = true;
            }
            this.dispatchEvent(toastEvent);
            this.showSpinner = false;
        };
        subscribe(this.channelName, -1, messageCallback).then((response) => {
            console.log('Subscribed to channel:', this.channelName);
            this.subscription = response;
        });
    }
    //This method sets up an error listener to log any errors received from the platform event channel.
    registerErrorListener() {
        onError((error) => {
            console.error('Error received from platform event channel:', error);
        });
    }
    //This method displays a toast notification with a given title, message, and variant using the ShowToastEvent
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    updateThemeColors(color) {
        // Update welcome container
        const welcomeContainer = this.template.querySelector('.welcome-container');
        if (welcomeContainer) {
            welcomeContainer.style.setProperty('--theme-color', color);
        }
        
        // Update SLDS brand color
        document.documentElement.style.setProperty('--lwc-brandPrimary', color);
    }

    handleThemeColorChange(event) {
        const newColor = event.target.value;
        this.themeColor = newColor;
        
        // Store in localStorage
        localStorage.setItem('themeColor', newColor);
        
        // Publish theme change
        publish(this.messageContext, THEME_CHANNEL, {
            color: newColor
        });
        
        // Update theme colors
        this.updateThemeColors(newColor);
    }

    // Error boundary
    handleError(error) {
        console.error('Setup Component Error:', error);
        this.showErrorToast(error);
        this.resetState();
    }

    // Performance monitoring
    measureOperation(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }

    // Lifecycle optimization
    disconnectedCallback() {
        this.clearCaches();
        this.unsubscribeFromEvents();
    }
}