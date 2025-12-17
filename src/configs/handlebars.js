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
        eq: (a, b) => a === b
      }
    })
  );
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "../views"));
};
