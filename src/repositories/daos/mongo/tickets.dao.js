import Ticket from "./models/tickets.model.js";

class TicketsDAO {
  async findById(id) {
    return await Ticket.findById(id);
  }

  async findByCode(code) {
    try {
      return await Ticket.findOne({ code });
    } catch (error) {
      throw new Error(`Error al buscar ticket por código: ${error.message}`);
    }
  }

  async findAll() {
    try {
      return await Ticket.find({}).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener tickets: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await Ticket.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error al actualizar ticket: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Ticket.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar ticket: ${error.message}`);
    }
  }

  async findByUser(userEmail) {
    try {
      return await Ticket.find({ purchaser: userEmail })
        .populate('products.product', 'title description price image code')
        .sort({
          createdAt: -1,
        });
    } catch (error) {
      throw new Error(`Error al buscar tickets del usuario: ${error.message}`);
    }
  }

  async create(ticketData) {
    try {
      return await Ticket.create(ticketData);
    } catch (error) {
      throw new Error(`Error creando ticket: ${error.message}`);
    }
  }
}

export default TicketsDAO;
