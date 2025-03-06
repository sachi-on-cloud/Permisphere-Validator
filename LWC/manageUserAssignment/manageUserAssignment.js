//This Component is Used to Handle the List of User based on Selected User Permisisons object permission and fieldPermissions
//This Component is used as child Component under manageUser and manageCloneUser
import {LightningElement,wire,api,track} from 'lwc';
import getPermissionSetsByUserLicense from '@salesforce/apex/ManageCloneUser.getPermissionSetsByUserLicense';
import getAssignedAssignment from '@salesforce/apex/ManageCloneUser.getAssignedAssignment';
import assignPermissionsAndGroups from '@salesforce/apex/ManageCloneUser.assignPermissionsAndGroups';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {refreshApex} from '@salesforce/apex';
export default class ManageUserAssignment extends LightningElement {

    @api userId;
    @track availablePermissionSets = [];
    @track availablePermissionSetGroups = [];
    @track availablePublicGroups = [];
    @track availableQueues = [];
    @track availablePermissionSetsLength = 0;
    @track availablePermissionSetGroupsLength = 0;
    @track availablePublicGroupsLength = 0;
    @track availableQueuesLength = 0;
    @track hasAvailPermissionSet = true;
    @track hasAvailPermissionSetGroup = true;
    @track hasAvailPublicGroup = true;
    @track hasAvailQueue = true;
    @track selectedPermissionSets = [];
    @track selectedPermissionSetGroups = [];
    @track selectedPublicGroups = [];
    @track selectedQueues = [];
    @track selectedPermissionSetsLength = 0;
    @track selectedPermissionSetGroupsLength = 0;
    @track selectedPublicGroupsLength = 0;
    @track selectedQueuesLength = 0;
    @track searchtermforperset = '';
    @track searchtermforpersetGrp = '';
    @track searchtermforPubGrp = '';
    @track searchtermforQueue = '';
    @track selectedPermissionSetIds = new Set();
    @track removedPermissionSetIds = new Set();
    @track selectedPermissionSetGroupIds = new Set();
    @track removedPermissionSetGroupIds = new Set();
    @track selectedPublicGroupIds = new Set();
    @track removedPublicGroupIds = new Set();
    @track selectedQueueIds = new Set();
    @track removedQueueIds = new Set();
    @track selectedPermissionSetId = [];
    @track selectedPermissionSetGroupId = [];
    @track selectedPublicGroupId = [];
    @track selectedQueueId = [];
    @track permissionSetIds = [];
    @track publicGroupIds = [];
    @track queueIds = [];
    showSpinner = true;
    @track isSave = true;
    @track originalAvailablePermissionSetIds = new Set();
    @track originalAvailablePermissionSetGroupIds = new Set();
    @track originalAvailablePublicGroupIds = new Set();
    @track originalAvailableQueueIds = new Set();
    @track originalSelectedPermissionSetIds = new Set();
    @track originalSelectedPermissionSetGroupIds = new Set();
    @track originalSelectedPublicGroupIds = new Set();
    @track originalSelectedQueueIds = new Set();
    @track wiredResult = [];
    @track wiredSelectedResult = [];
    error;

    // Group related state
    @track assignmentState = {
        permissionSets: {
            available: [],
            selected: new Set(),
            removed: new Set()
        },
        permissionSetGroups: {
            available: [],
            selected: new Set(),
            removed: new Set()
        }
    };

    // Debounce search
    searchDebounceTimeout;
    handleSearch(event) {
        clearTimeout(this.searchDebounceTimeout);
        this.searchDebounceTimeout = setTimeout(() => {
            this.updateSearchResults(event.target.value);
        }, 300);
    }

    // Memoize filtered results
    filteredResultsMemo = {};
    getFilteredResults(items, searchTerm) {
        const cacheKey = `${items.length}-${searchTerm}`;
        if (this.filteredResultsMemo[cacheKey]) {
            return this.filteredResultsMemo[cacheKey];
        }

        const results = items.filter(item => 
            item.Name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.filteredResultsMemo[cacheKey] = results;
        return results;
    }

    //The @wire function fetches permission sets, permission set groups, public groups, and queues based on the provided userId
    @wire(getPermissionSetsByUserLicense, {
        userId: '$userId'
    })
    wiredAvailablePermissionSets(result) {
        this.wiredResult = result;
        const {
            data,
            error
        } = result;

        if (data) {
            this.availablePermissionSets = data.permissionSets;
            this.availablePermissionSetGroups = data.permissionSetGroups;
            this.availablePublicGroups = data.publicGroupQueue.filter(group => group.Type === 'Regular');
            this.availableQueues = data.publicGroupQueue.filter(group => group.Type === 'Queue');

            this.originalAvailablePermissionSetIds = new Set(this.availablePermissionSets.map(set => set.Id));
            this.originalAvailablePermissionSetGroupIds = new Set(this.availablePermissionSetGroups.map(set => set.Id));
            this.originalAvailablePublicGroupIds = new Set(this.availablePublicGroups.map(set => set.Id));
            this.originalAvailableQueueIds = new Set(this.availableQueues.map(set => set.Id));

            this.availablePermissionSetsLength = this.availablePermissionSets.length;
            this.availablePermissionSetGroupsLength = this.availablePermissionSetGroups.length;
            this.availablePublicGroupsLength = this.availablePublicGroups.length;
            this.availableQueuesLength = this.availableQueues.length;

            this.hasAvailPermissionSet = this.availablePermissionSets.length > 0;
            this.hasAvailPermissionSetGroup = this.availablePermissionSetGroups.length > 0;
            this.hasAvailPublicGroup = this.availablePublicGroups.length > 0;
            this.hasAvailQueue = this.availableQueues.length > 0;

        } else if (error) {
            console.error('Error fetching permission sets:', error);
        }
    }

    //The @wire function retrieves assigned permission sets, groups, public groups, and queues for a user
    @wire(getAssignedAssignment, {
        userId: '$userId'
    })
    wiredSelectedPermissionSets(result) {
        this.wiredSelectedResult = result;
        const {data,error} = result;

        if (data) {
            this.selectedPermissionSets = data.permissionSets;
            this.selectedPermissionSetGroups = data.permissionSetGroups;
            this.selectedPublicGroups = data.publicGroupQueue.filter(group => group.Type === 'Regular');
            this.selectedQueues = data.publicGroupQueue.filter(group => group.Type === 'Queue');
            this.originalSelectedPermissionSetIds = new Set(this.selectedPermissionSets.map(set => set.Id));
            this.originalSelectedPermissionSetGroupIds = new Set(this.selectedPermissionSetGroups.map(set => set.Id));
            this.originalSelectedPublicGroupIds = new Set(this.selectedPublicGroups.map(set => set.Id));
            this.originalSelectedQueueIds = new Set(this.selectedQueues.map(set => set.Id));
            this.selectedPermissionSetsLength = this.selectedPermissionSets.length;
            this.selectedPermissionSetGroupsLength = this.selectedPermissionSetGroups.length;
            this.selectedPublicGroupsLength = this.selectedPublicGroups.length;
            this.selectedQueuesLength = this.selectedQueues.length;
            this.showSpinner = false;

        } else if (error) {
            console.error('Error fetching permission sets:', error);
            this.showSpinner = false;
        }
    }

    //This method used for the selection of a permission set ID 
    handleSelectPermissionSetToAdd(event) {
        const userId = event.currentTarget.dataset.id;
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
                this.selectedPermissionSetsLength = this.selectedPermissionSets.length;
                this.removedPermissionSetIds.delete(id);
            }
        });
        this.selectedPermissionSetId = this.selectedPermissionSets.map(item => item.Id);
        this.selectedPermissionSetsLength = this.selectedPermissionSetId.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }


    //The method updates the UI by adding or removing the selected-user CSS class to elements based on the current selection or removal state for permission sets, groups, public groups, and queues.
    updateHighlight() {
        this.template.querySelectorAll('.slds-grid').forEach(item => {
            item.classList.remove('selected-user');
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
        this.selectedPermissionSetGroupIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.available-group[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedPermissionSetGroupIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.selected-group[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });

        this.selectedPublicGroupIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.available-publicgroup[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedPublicGroupIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.selected-publicgroup[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });

        this.selectedQueueIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.available-queue[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedQueueIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.selected-queue[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });
    }

    //This method used for the selection of a permission set group ID
    handleSelectPermissionSetGroupToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.selectedPermissionSetGroupIds.has(userId)) {
            this.selectedPermissionSetGroupIds.delete(userId);
        } else {
            this.selectedPermissionSetGroupIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method toggles the removal state of a permission set group ID
    handleSelectPermissionSetGroupToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedPermissionSetGroupIds.has(userId)) {
            this.removedPermissionSetGroupIds.delete(userId);
        } else {
            this.removedPermissionSetGroupIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method moves selected permission sets group from the available list to the selected list
    handleToAddSelectedPermissionSetGroupButton() {
        this.selectedPermissionSetGroupIds.forEach(id => {
            const set = this.availablePermissionSetGroups.find(set => set.Id === id);
            if (set) {
                if (this.originalAvailablePermissionSetGroupIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.selectedPermissionSetGroups = [...this.selectedPermissionSetGroups, set];
                this.selectedPermissionSetGroupId = this.selectedPermissionSetGroups.map(item => item.Id);
                this.selectedPermissionSetGroupsLength = this.selectedPermissionSetGroupId.length;
                this.availablePermissionSetGroups = this.availablePermissionSetGroups.filter(item => item.Id !== id);
                this.selectedPermissionSetGroupIds.delete(id);
            }
        });
        this.availablePermissionSetGroupsLength = this.availablePermissionSetGroups.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds));
    }

    //This Method is used to remove the selected Ids for new Permission Set Group Creation
    handleToRemoveSelectedPermissionSetGroupButton() {
        this.removedPermissionSetGroupIds.forEach(id => {
            const set = this.selectedPermissionSetGroups.find(set => set.Id === id);
            if (set) {
                if (this.originalSelectedPermissionSetGroupIds.has(id)) {
                    this.permissionSetIds.push(id);
                } else {
                    this.permissionSetIds = this.permissionSetIds.filter(existingId => existingId !== id);
                }
                this.availablePermissionSetGroups = [...this.availablePermissionSetGroups, set];
                this.availablePermissionSetGroupsLength = this.availablePermissionSetGroups.length;
                this.selectedPermissionSetGroups = this.selectedPermissionSetGroups.filter(item => item.Id !== id);
                this.selectedPermissionSetGroupsLength = this.selectedPermissionSetGroups.length;
                this.removedPermissionSetGroupIds.delete(id);
            }
        });
        this.selectedPermissionSetGroupId = this.selectedPermissionSetGroups.map(item => item.Id);
        this.selectedPermissionSetGroupsLength = this.selectedPermissionSetGroupId.length;
        this.updateHighlight();
        this.isSave = !(this.permissionSetIds.length > 0);
        console.log('permissionSetIds', JSON.stringify(this.permissionSetIds))
    }

    //This method used for the selection of a Public Group ID
    handleSelectPublicGroupToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.selectedPublicGroupIds.has(userId)) {
            this.selectedPublicGroupIds.delete(userId);
        } else {
            this.selectedPublicGroupIds.add(userId);
        }
        this.updateHighlight();
    }
    //This method toggles the removal state of a Public Group ID
    handleSelectPublicGroupToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedPublicGroupIds.has(userId)) {
            this.removedPublicGroupIds.delete(userId);
        } else {
            this.removedPublicGroupIds.add(userId);
        }
        this.updateHighlight();
    }
    //This method moves selected Public Group from the available list to the selected list
    handleToAddSelectedPublicGroupButton() {
        this.selectedPublicGroupIds.forEach(id => {
            const set = this.availablePublicGroups.find(set => set.Id === id);
            if (set) {
                if (this.originalAvailablePublicGroupIds.has(id)) {
                    this.publicGroupIds.push(id);
                } else {
                    this.publicGroupIds = this.publicGroupIds.filter(existingId => existingId !== id);
                }
                this.selectedPublicGroups = [...this.selectedPublicGroups, set];
                this.selectedPublicGroupId = this.selectedPublicGroups.map(item => item.Id);
                this.selectedPublicGroupsLength = this.selectedPublicGroupId.length;
                this.availablePublicGroups = this.availablePublicGroups.filter(item => item.Id !== id);
                this.selectedPublicGroupIds.delete(id);
            }
        });
        this.availablePublicGroupsLength = this.availablePublicGroups.length;
        this.updateHighlight();
        this.isSave = !(this.publicGroupIds.length > 0);
        console.log('this.publicGroupIds', JSON.stringify(this.publicGroupIds));
    }

    //This Method is used to remove the selected Ids for new Public Group Creation
    handleToRemoveSelectedPublicGroupButton() {
        this.removedPublicGroupIds.forEach(id => {
            const set = this.selectedPublicGroups.find(set => set.Id === id);
            if (set) {
                if (this.originalSelectedPublicGroupIds.has(id)) {
                    this.publicGroupIds.push(id);
                } else {
                    this.publicGroupIds = this.publicGroupIds.filter(existingId => existingId !== id);
                }
                this.availablePublicGroups = [...this.availablePublicGroups, set];
                this.availablePublicGroupsLength = this.availablePublicGroups.length;
                this.selectedPublicGroups = this.selectedPublicGroups.filter(item => item.Id !== id);
                this.selectedPublicGroupsLength = this.selectedPublicGroups.length;
                this.removedPublicGroupIds.delete(id);
            }
        });
        this.selectedPublicGroupId = this.selectedPublicGroups.map(item => item.Id);
        this.selectedPublicGroupsLength = this.selectedPublicGroupId.length;
        this.updateHighlight();
        this.isSave = !(this.publicGroupIds.length > 0);
        console.log('this.publicGroupIds', JSON.stringify(this.publicGroupIds))
    }

    //This method used for the selection of a Queue ID
    handleSelectQueueToAdd(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.selectedQueueIds.has(userId)) {
            this.selectedQueueIds.delete(userId);
        } else {
            this.selectedQueueIds.add(userId);
        }
        this.updateHighlight();
    }
    //This method toggles the removal state of a Queue ID
    handleSelectQueueToRemove(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedQueueIds.has(userId)) {
            this.removedQueueIds.delete(userId);
        } else {
            this.removedQueueIds.add(userId);
        }
        this.updateHighlight();
    }
    //This method moves selected Queue from the available list to the selected list
    handleToAddSelectedQueueButton() {
        this.selectedQueueIds.forEach(id => {
            const set = this.availableQueues.find(set => set.Id === id);
            if (set) {
                if (this.originalAvailableQueueIds.has(id)) {
                    this.queueIds.push(id);
                } else {
                    this.queueIds = this.queueIds.filter(existingId => existingId !== id);
                }
                this.selectedQueues = [...this.selectedQueues, set];
                this.selectedQueueId = this.selectedQueues.map(item => item.Id);
                this.selectedQueuesLength = this.selectedQueueId.length;
                this.availableQueues = this.availableQueues.filter(item => item.Id !== id);
                this.selectedQueueIds.delete(id);
            }
        });
        this.availableQueuesLength = this.availableQueues.length;
        this.updateHighlight();
        this.isSave = !(this.queueIds.length > 0);
        console.log('this.queueIds', JSON.stringify(this.queueIds));
    }

    //This Method is used to remove the selected Ids for new Queue Creation
    handleToRemoveSelectedQueueButton() {
        this.removedQueueIds.forEach(id => {
            const set = this.selectedQueues.find(set => set.Id === id);
            if (set) {
                if (this.originalSelectedQueueIds.has(id)) {
                    this.queueIds.push(id);
                } else {
                    this.queueIds = this.queueIds.filter(existingId => existingId !== id);
                }
                this.availableQueues = [...this.availableQueues, set];
                this.availableQueuesLength = this.availableQueues.length;
                this.selectedQueues = this.selectedQueues.filter(item => item.Id !== id);
                this.selectedQueuesLength = this.selectedQueues.length;
                this.removedQueueIds.delete(id);
            }
        });
        this.selectedQueueId = this.selectedQueues.map(item => item.Id);
        this.selectedQueuesLength = this.selectedQueueId.length;
        this.updateHighlight();
        this.isSave = !(this.queueIds.length > 0);
        console.log('this.queueIds', JSON.stringify(this.queueIds))
    }
    //The getter filters PermissionSets based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailablePerSet() {
        if (this.searchtermforperset) {
            const filtered = this.availablePermissionSets.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforperset.toLowerCase()));
            this.hasAvailPermissionSet = filtered.length > 0;
            return filtered;
        } else {
            return this.availablePermissionSets;
        }
    }
    //The getter filters Permission Set Group based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailablePerSetGrp() {
        if (this.searchtermforpersetGrp) {
            const filtered = this.availablePermissionSetGroups.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforpersetGrp.toLowerCase()));
            this.hasAvailPermissionSetGroup = filtered.length > 0;
            return filtered;
        } else {
            return this.availablePermissionSetGroups;
        }
    }
    //The getter filters Public Group based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailablePublicGrp() {
        if (this.searchtermforPubGrp) {
            const filtered = this.availablePublicGroups.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforPubGrp.toLowerCase()));
            this.hasAvailPublicGroup = filtered.length > 0;
            return filtered;
        } else {
            return this.availablePublicGroups;
        }
    }
    //The getter filters Queue based on a search term, updates whether any are available, and returns the filtered or full list.
    get filteredAvailableQueue() {
        if (this.searchtermforQueue) {
            const filtered = this.availableQueues.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforQueue.toLowerCase()));
            this.hasAvailQueue = filtered.length > 0;
            return filtered;
        } else {
            return this.availableQueues;
        }
    }
    //This method updates the searchtermforperset with the input value from the event, triggering the filtering of available permission sets.
    handleSearchAvailablePerSet(event) {
        this.searchtermforperset = event.target.value;
        this.filteredAvailablePerSet;
    }
    //This method updates the searchtermforpersetGrp with the input value from the event, triggering the filtering of available permission set Group.
    handleSearchAvailablePerSetGrp(event) {
        this.searchtermforpersetGrp = event.target.value;
        this.filteredAvailablePerSetGrp;
    }
    //This method updates the searchtermforPubGrp with the input value from the event, triggering the filtering of available public group.
    handleSearchAvailablePubGrp(event) {
        this.searchtermforPubGrp = event.target.value;
        this.filteredAvailablePublicGrp;
    }
    //This method updates the searchtermforQueue with the input value from the event, triggering the filtering of available queue.
    handleSearchAvailableQueue(event) {
        this.searchtermforQueue = event.target.value;
        this.filteredAvailableQueue;
    }
    //This method used to save the permission set, permission set group,public group,queue to the user
    async handleSave() {
        try {
            this.showSpinner = true;
            const updates = this.prepareUpdates();
            
            // Process in batches of 200
            const batches = this.createBatches(updates, 200);
            await this.processBatches(batches);
            
            this.dispatchEvent(new CustomEvent('assignmentupdate', {
                detail: { success: true }
            }));
        } catch (error) {
            this.handleError(error);
        } finally {
            this.showSpinner = false;
        }
    }
    //This method displays a toast notification with a given title, message, and variant using the ShowToastEvent
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
    //This method used to close the modal 
    closeModal() {
        this.permissionSetIds = [];
        this.publicGroupIds = [];
        this.queueIds = [];
        this.isSave = true;
        this.dispatchEvent(new CustomEvent("closeassignment", {
            bubbles: true,
            composed: true,
        }));
    }

    // Error handling
    handleError(error) {
        console.error('Assignment Error:', error);
        const message = this.extractErrorMessage(error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }

    // Validation
    validateAssignments(assignments) {
        return assignments.every(assignment => {
            return (
                typeof assignment.Id === 'string' &&
                assignment.Id.length === 18
            );
        });
    }

    // Custom events
    notifyAssignmentChange() {
        const event = new CustomEvent('assignmentchange', {
            detail: {
                changes: this.getChanges(),
                timestamp: Date.now()
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
}