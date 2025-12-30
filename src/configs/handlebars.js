import exphbs from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const configureHandlebars = (app) => {
  app.engine(
    "hbs",
    exphbs.engine({
      extname: ".hbs",
      defaultLayout: "main",
      layoutsDir: path.join(__dirname, "../views/layouts"),      
      partialsDir: path.join(__dirname, "../views/partials"),
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
      helpers: {
        multiply: (a, b) => a * b,
        sumCartTotal: function (cart) {
          if (!Array.isArray(cart)) return 0;
          return cart.reduce((total, item) => {
            if (item && typeof item.price === "number") {
              return total + item.price * (item.quantity || 1);
            }
            return total;
          }, 0);
        },
        eq: (a, b) => a === b,
        formatDate: function(date) {
          if (!date) return '';
          const d = new Date(date);
          return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    })
  );
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "../views"));
};
