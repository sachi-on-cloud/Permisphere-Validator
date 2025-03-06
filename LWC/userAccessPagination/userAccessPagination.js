//This component is used for custom pagination.
//This component is used in managePermissionSetComponent & managePermissionSetGroupComponent.
import { LightningElement, api } from 'lwc';

export default class UserAccessPagination extends LightningElement {
    @api recordSize = 20;
    @api hideButtonLabels = "false";
    
    currentPage = 1;
    totalRecords;
    totalRecordsCount = 0;
    totalPage = 0;
    
    // Reactive properties
    @api
    get visibleRecords() {
        return this._visibleRecords;
    }
    set visibleRecords(value) {
        this._visibleRecords = value;
        this.updatePaginationState();
    }

    // Computed properties
    get disablePrevious() {
        return this.currentPage <= 1;
    }

    get disableNext() {
        return this.currentPage >= this.totalPage;
    }

    get currentPageLabel() {
        return this.hideButtonLabels === "true" 
            ? `Page ${this.currentPage} of ${this.totalPage}`
            : `Showing ${this.currentPage} of ${this.totalPage} Page`;
    }

    get totalRecordLabel() {
        return this.hideButtonLabels === "true"
            ? `Total: ${this.totalRecordsCount}`
            : `Total Records: ${this.totalRecordsCount}`;
    }

    // Event handlers with error boundaries
    handlePageChange(direction) {
        try {
            switch(direction) {
                case 'first':
                    this.currentPage = 1;
                    break;
                case 'previous':
                    if (this.currentPage > 1) {
                        this.currentPage--;
                    }
                    break;
                case 'next':
                    if (this.currentPage < this.totalPage) {
                        this.currentPage++;
                    }
                    break;
                case 'last':
                    this.currentPage = this.totalPage;
                    break;
            }
            this.updateRecords();
        } catch (error) {
            this.handleError(error);
        }
    }

    // Update pagination state
    updatePaginationState() {
        if (this.totalRecords) {
            this.totalRecordsCount = this.totalRecords.length;
            this.totalPage = Math.ceil(this.totalRecordsCount / this.recordSize);
            this.updateRecords();
        }
    }

    // Process records with performance optimization
    updateRecords() {
        const start = (this.currentPage - 1) * this.recordSize;
        const end = this.recordSize * this.currentPage;
        
        this.visibleRecords = this.totalRecords.slice(start, end);
        
        this.dispatchEvent(new CustomEvent('paginationevent', {
            detail: {
                slicedRecords: [...this.visibleRecords],
                bubbles: true,
                composed: true
            }
        }));
    }

    // Error handling
    handleError(error) {
        console.error('Pagination Error:', error);
        // Dispatch error event for parent handling
        this.dispatchEvent(new CustomEvent('paginationerror', {
            detail: error
        }));
    }
}