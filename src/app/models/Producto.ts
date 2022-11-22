export class Producto {
    constructor(
        public _id: string,
        public titulo: string,
        public descripcion: string,
        public precio_venta: string,
        public precio_compra: string,
        public stock: number,
        public idcategoria: string,
        public puntos: number,
        public identificador?: string,
        public codigo?: string,
        public imagenes?: any
    ) {}
}