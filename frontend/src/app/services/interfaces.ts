export interface Dictionary<V> {
    [key: string]: V;
}

export interface Index<V> {
    [index: number]: V;
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
    static_texture_paths: Index<string>;
    static_model_paths: Dictionary<string>;
}

export interface CategoryDetail extends Category {
    is_leaf: boolean;
    ships: ShipListEntry[];
}

export interface CategoryTree extends Category {
    children: CategoryTree[],
    parent_id: number,
}
