import { Category } from './interfaces';

export interface Pagination {
    page: number,
    itemsPerPage: number,
}

export interface Category {
    id: number,
    name: string,
    path: string,
    description: string,
    background?: string,
    logo?: string,
}

export interface ShipListEntry {
    id: number,
    name: string,
    price: number,
    category: Category,
    // TODO: more list details
}

export interface ShipDetails extends ShipListEntry {
    infocard: string,
    max_bats: number,
    mass: number,
    id: number,
    drag_y: number,
    max_bots: number,
    nudge: number,
    torgue_z: number,
    hold_size: number,
    strafe: number,
    inertia_z: number,
    lods: string[],
    drag_z: number,
    inertia_y: number,
    strafe_power: number,
    weapon_angle: number,
    drag_x: number,
    inertia_x: number,
    torgue_x: number,
    hitpoints: number,
    torgue_y: number,
}

export interface CategoryDetail extends Category {
    is_leaf: boolean;
    ships: ShipListEntry[];
}

export interface CategoryTree extends Category {
    children: CategoryTree[],
    parent_id: number,
}

export interface Filter {
    search?: string,
    pagination?: Pagination,
}

export interface Dictionary<V> {
    [key: string]: V;
}

export interface Index<V> {
    [index: number]: V;
}
