interface SalesByStatus {
    total: number,
    submitted: number,
    completed: number
}

interface InventoryQuantityPrices {
    price: number,
    quantity: number
}

export const inventoryQuantityPrices = (inventory: {_id: string, price: number, quantity: number}[]): InventoryQuantityPrices => {
    const price = inventory.map(x => x.price).reduce((acc, current) => acc + current, 0);
    const quantity = inventory.map(x => x.quantity).reduce((acc, current) => acc + current, 0);

    return {price, quantity};
}

export const salesByStatus = (salesStatuses: {_id: string, status: string}[]): SalesByStatus => {
    const submitted = salesStatuses.map(x => x.status).filter(x => x == 'submitted').reduce((acc, current) => acc + 1, 0)
    const completed = salesStatuses.map(x => x.status).filter(x => x == 'completed').reduce((acc, current) => acc + 1, 0)
    
    const result: SalesByStatus = {
        submitted,
        completed,
        total: submitted + completed
    }

    return result;
}