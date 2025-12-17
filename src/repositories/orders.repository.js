import OrdersDAO from "./daos/mongo/orders.dao.js";
export default class OrdersRepository {
  constructor(){ this.dao = new OrdersDAO(); }
  create(data){ return this.dao.create(data); }
  getById(id){ return this.dao.getById(id); }
  markPaid(id){ return this.dao.markPaid(id); }
  updateStatus(id, status){ return this.dao.updateStatus(id, status); }
}
