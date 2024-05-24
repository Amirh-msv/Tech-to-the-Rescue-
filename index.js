const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// Store user sessions to track conversation state
let userSessions = {};

// Define questions and menus based on the detailed conversation flow
const questions = [
    "¿Cuántos años tienes?",
    "¿Con qué género te identificas? Selecciona el número de la opción.\n1. Mujer\n2. Hombre\n3. Otro",
    "Cantón y parroquia dónde vives.",
    "¿Cuántos hijos tienes?"
];

// Ingredients and their nutritional values (from previous input)
const ingredients = {
    "leche": "Calcio",
    "platano verde": "Fibra",
    "mandarina": "Vitamina",
    "naranja": "Vitamina",
    "habas": "Proteína",
    "papa": "Hierro",
    "huevo": "Proteína",
    "espinaca": "Hierro",
    "tomate de riñon": "Calcio",
    "limon": "Vitamina",
    "perejil": "Vitamina",
    "sandia": "Vitamina",
    "avena": "Fibra",
    "uva": "Fibra",
    "manzana": "Calcio",
    "galletas": "Fibra",
    "arroz": "Fibra",
    "carne": "Proteína",
    "aguacate": "Fibra",
    "tomate arbol": "Vitamina",
    "maicena": "Proteína",
    "guayaba": "Vitamina",
    "yogurt": "Vitamina",
    "granola": "Fibra",
    "melon": "Vitamina",
    "frejol": "Proteína",
    "ziccini": "Vitamina",
    "fresa": "Vitamina",
    "kiwi": "Vitamina",
    "papaya": "Vitamina",
    "nuez": "Zinc",
    "pollo": "Proteína",
    "quinua": "Calcio",
    "brocoli": "Vitamina",
    "piña": "Vitamina",
    "chochos": "Proteína",
    "tostado": "Vitamina",
    "queso": "Vitamina",
    "berenjena": "Fibra",
    "yuca": "Hierro",
    "zanahoria": "Vitamina",
    "albahaca": "Calcio",
    "mora": "Vitamina",
    "guineo": "Vitamina",
    "choclo": "Vitamina",
    "mote": "Hierro",
    "biscocho": "Proteína",
    "remolacha": "Hierro",
    "acelga": "Vitamina",
    "mani": "Vitamina",
    "canguil": "Vitamina",
    "higado": "Hierro",
    "vainita": "Calcio",
    "almendras": "Proteína",
    "aplanchado": "Fibra",
    "durazno": "Vitamina",
    "col morada": "Vitamina",
    "curtido": "Vitamina",
    "camote": "Proteína",
    "melloco": "Vitamina"
};

// Menus and their nutritional information (from previous input)
const menus = {
    "1": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1 unidad pequeña en 1 cdta de aceite", product: "TORTILLA DE VERDE", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "40 g" },
        { portion: "2 unidades pequeñas", product: "MANDARINA", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "8.01 mg" },
        { portion: "1 unidad", product: "NARANJA SIN PEPA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "7.7 mg" },
        { portion: "3 cdas", product: "HABAS", meal: "Media Mañana", keyNutrient: "Proteína", nutritionalValue: "5.4 g" },
        { portion: "1 unidad", product: "PAPA COCIDA", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "37 g" },
        { portion: "1 unidad de huevo + 1/2 taza de espinaca cocida", product: "HUEVO REVUELTO CON ESPINACA", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "9.2 g" },
        { portion: "1/2 taza de tomate + 1 cdta de aceite", product: "RODAJAS DE TOMATE CON PEREJIL, LIMÓN Y ACEITE", meal: "Almuerzo", keyNutrient: "Calcio", nutritionalValue: "27 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: SANDIA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "24.31 mg" },
        { portion: "1/2 unidad guineo + 1/2 taza de avena", product: "AVENA CON FRUTA", meal: "Media Tarde", keyNutrient: "Fibra", nutritionalValue: "5.6 g" }
    ],
    "2": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1/2 unidad", product: "PAN DE DULCE", meal: "Desayuno", keyNutrient: "Carbohidratos", nutritionalValue: "50 g" },
        { portion: "17 unidades", product: "UVAS", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "0.8 g" },
        { portion: "1 unidad mediana", product: "MANZANA", meal: "Media Mañana", keyNutrient: "Calcio", nutritionalValue: "10 mg" },
        { portion: "2 unidades", product: "GALLETAS", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "5 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño de carne + 1/2 taza de zanahoria y tomate", product: "BISTEC DE CARNE CON VERDURAS", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "26.6 g" },
        { portion: "1/8 de aguacate", product: "AGUACATE", meal: "Almuerzo", keyNutrient: "Fibra", nutritionalValue: "1.5 g" },
        { portion: "1 unidad pequeña", product: "JUGO DE TOMATE DE ÁRBOL", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "36.8 mg" },
        { portion: "2 cdas de maicena + 1 unidad de guayaba.", product: "MAICENA CON GUAYABA", meal: "Media Tarde", keyNutrient: "Proteína", nutritionalValue: "1.4 g" }
    ],
    "3": [
        { portion: "1/2 taza", product: "YOGURT", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "0.47 mg" },
        { portion: "1/4 taza", product: "GRANOLA", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "2.5 g" },
        { portion: "1 taza", product: "MELÓN EN CUADRITOS", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "57.2 mg" },
        { portion: "1 taza", product: "SANDIA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "13.14 mg" },
        { portion: "1/4 taza", product: "AVENA TOSTADA", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "3 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1/2 taza de frejol + 1/2 taza de tomate", product: "MENESTRA DE FREJOL CON TOMATE", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "9 g" },
        { portion: "1/2 taza", product: "ZUCCHINI ASADO", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "6.67 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: FRESAS", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "1 taza de kiwi y papaya", product: "ENSALADA DE FRUTAS", meal: "Media Tarde", keyNutrient: "Vitaminas", nutritionalValue: "225 mg" }
    ],
    "4": [
        { portion: '1/2 taza', product: 'LECHE', meal: 'Desayuno', keyNutrient: 'Calcio', nutritionalValue: '150 mg' },
        { portion: '1/2 unidad de pan y 2 huevos de codorniz', product: 'HUEVOS DE CODORNIZ', meal: 'Desayuno', keyNutrient: 'Proteína', nutritionalValue: '6 g' },
        { portion: '1 taza', product: 'FRESAS', meal: 'Desayuno', keyNutrient: 'Vitaminas', nutritionalValue: '89.04 mg' },
        { portion: '7 unidades', product: 'UVAS', meal: 'Media Mañana', keyNutrient: 'Fibra', nutritionalValue: '0.3 g' },
        { portion: '4 mitades', product: 'NUECES', meal: 'Media Mañana', keyNutrient: 'Zinc', nutritionalValue: '0.3 mg' },
        { portion: '1/3 taza', product: 'QUINUA COCIDA', meal: 'Almuerzo', keyNutrient: 'Calcio', nutritionalValue: '20 mg' },
        { portion: '1/2 filete de pollo + 10 unidades de maní', product: 'POLLO EN SALSA DE MANI', meal: 'Almuerzo', keyNutrient: 'Proteína', nutritionalValue: '20 g' },
        { portion: '1 taza cocido', product: 'BROCOLI+ TOMATE', meal: 'Almuerzo', keyNutrient: 'Vitaminas', nutritionalValue: '108.6 mg' },
        { portion: '1 taza', product: 'PORCION DE FRUTA PICADA: PIÑA', meal: 'Almuerzo', keyNutrient: 'Vitaminas', nutritionalValue: '79.02 mg' },
        { portion: '1/4 taza', product: 'CHOCHOS', meal: 'Media Tarde', keyNutrient: 'Proteína', nutritionalValue: '0.6 g' },
        { portion: '1/4 taza', product: 'TOSTADO', meal: 'Media Tarde', keyNutrient: 'Vitaminas', nutritionalValue: '6 mg' },
    ],
    "5": [
        { portion: "1/4 de unidad de maduro mediano + 1 rodaja de queso", product: "MADURO + QUESO", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "1 g" },
        { portion: "1 taza", product: "SANDIA", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "13.14 mg" },
        { portion: "2 unidades pequeñas", product: "MANDARINA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "8.01 mg" },
        { portion: "1 unidad", product: "BISCOCHO", meal: "Media Mañana", keyNutrient: "Carbohidratos", nutritionalValue: "30 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1/2 taza de lenteja + 1/2 taza de tomate", product: "MENESTRA DE LENTEJA CON TOMATE", meal: "Almuerzo", keyNutrient: "Fibra", nutritionalValue: "9 g" },
        { portion: "1/2 taza de berenjena y 1 cdta de aceite.", product: "BERENGENA EN RODAJAS A LA PLANCHA", meal: "Almuerzo", keyNutrient: "Fibra", nutritionalValue: "2.5 g" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: MANZANA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "10 mg" },
        { portion: "3 cdas de quinua + 1/2 taza de manzana.", product: "COLADA DE QUINUA CON MANZANA (azúcar o panela opcional)", meal: "Media Tarde", keyNutrient: "Calcio", nutritionalValue: "22.5 mg" }
    ],
    "6": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1 unidad pequeña", product: "TORTILLA DE YUCA", meal: "Desayuno", keyNutrient: "Hierro", nutritionalValue: "0.5 mg" },
        { portion: "1 taza", product: "KIWI", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "139 mg" },
        { portion: "1/4 taza", product: "CHOCHOS", meal: "Media Mañana", keyNutrient: "Proteína", nutritionalValue: "0.6 g" },
        { portion: "1/2 taza", product: "PURÉ DE ZANAHORIA BLANCA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "0.25 mg" },
        { portion: "1 filete pequeño + 1 cdta de aceite", product: "CARNE A LA PLANCHA", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "25 g" },
        { portion: "1/2 taza", product: "TOMATE+ ESPINACA Y TROCITOS ALBAHACA", meal: "Almuerzo", keyNutrient: "Calcio", nutritionalValue: "100 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: MORA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "139 mg" },
        { portion: "2 cdas de harina de plátano + 1/2 taza fresa", product: "COLADA DE HARINA DE PLATANO CON FRESA", meal: "Media Tarde", keyNutrient: "Potasio", nutritionalValue: "229 mg" }
    ],
    "7": [
        { portion: "1/2 taza de leche + 1/2 guineo", product: "BATIDO DE GUINEO", meal: "Desayuno", keyNutrient: "Potasio", nutritionalValue: "365 mg" },
        { portion: "1/2 pan con 1 cdta de mantequilla", product: "TOSTADA", meal: "Desayuno", keyNutrient: "Carbohidratos", nutritionalValue: "20 g" },
        { portion: "1 taza", product: "MANZANA", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "10 mg" },
        { portion: "1 taza", product: "PIÑA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "79.02 mg" },
        { portion: "1/4 taza", product: "CHOCLO DESGRANADO", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "20 mg" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño de pollo + 1/2 taza de acelga + 1/2 taza tomate", product: "BISTEC DE POLLO CON ACELGA Y TOMATE", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "25 g" },
        { portion: "1/8 de unidad", product: "AGUACATE", meal: "Almuerzo", keyNutrient: "Fibra", nutritionalValue: "1.5 g" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: FRESAS", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "2 cdas de machica + 1/2 taza de manzana.", product: "COLADA DE MACHICA CON MANZANA (azúcar o panela opcional)", meal: "Media Tarde", keyNutrient: "Calcio", nutritionalValue: "7 g" }
    ],
    "8": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1/4 de verde majado", product: "MAJADO DE VERDE", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "2 g" },
        { portion: "17 unidades", product: "UVAS", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "0.8 g" },
        { portion: "1 taza", product: "FRESAS", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "2 unidades", product: "GALLETAS", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "5 g" },
        { portion: "1/2 taza de mote + 1 huevo mediano", product: "MOTE PILLO", meal: "Almuerzo", keyNutrient: "Hierro", nutritionalValue: "25 mg" },
        { portion: "1/2 unidad", product: "PORCION DE FRUTA PICADA: GUINEO", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "19 mg" },
        { portion: "1/2 taza de manzana", product: "COLADA DE MANZANA", meal: "Media Tarde", keyNutrient: "Calcio", nutritionalValue: "10 mg" },
        { portion: "1/2 unidad", product: "PAN DULCE", meal: "Media Tarde", keyNutrient: "Carbohidratos", nutritionalValue: "50 g" }
    ],
    "9": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1/2 pan + 1 cdta de mantequilla", product: "TOSTADA", meal: "Desayuno", keyNutrient: "Carbohidratos", nutritionalValue: "20 g" },
        { portion: "1 unidad mediana", product: "MANZANA", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "10 mg" },
        { portion: "1/2 unidad", product: "GUINEO", meal: "Media Mañana", keyNutrient: "Potasio", nutritionalValue: "19 mg" },
        { portion: "1 unidad", product: "BISCOCHO", meal: "Media Mañana", keyNutrient: "Carbohidratos", nutritionalValue: "30 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño + 10 unidades de maní", product: "CARNE A LA PLANCHA CON SALSA DE MANÍ", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "20 g" },
        { portion: "1/2 taza", product: "ZANAHORIA + REMOLACHA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "14 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: PIÑA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "79.02 mg" },
        { portion: "1 taza", product: "FRESAS", meal: "Media Tarde", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "1/4 taza", product: "AVENA TOSTADA", meal: "Media Tarde", keyNutrient: "Fibra", nutritionalValue: "3 g" }
    ],
    "10": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1/4 de unidad", product: "MADURO COCINADO", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "2 g" },
        { portion: "1 taza/1 rodaja", product: "SANDIA", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "24.31 mg" },
        { portion: "1 taza/1 rodaja", product: "FRESA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "1 taza", product: "CANGUIL", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "4 mg" },
        { portion: "1/3 de taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño", product: "BISTEC DE HIGADO", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "25 g" },
        { portion: "1 taza", product: "ZANAHORIA CON VAINITA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "20 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: KIWI", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "139 mg" },
        { portion: "1 taza de pera y melón", product: "ENSALADA DE FRUTAS", meal: "Media Tarde", keyNutrient: "Vitaminas", nutritionalValue: "45 mg" },
        { portion: "6 unidades", product: "ALMENDRAS", meal: "Media Tarde", keyNutrient: "Proteína", nutritionalValue: "2 g" }
    ],
    "11": [
        { portion: "1/2 taza", product: "YOGURT", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "0.47 mg" },
        { portion: "1/2 pan + 1 cdta de mantequilla", product: "TOSTADA", meal: "Desayuno", keyNutrient: "Carbohidratos", nutritionalValue: "20 g" },
        { portion: "1 taza", product: "PIÑA", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "79.02 mg" },
        { portion: "2 unidades pequeñas", product: "MANDARINA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "8.01 mg" },
        { portion: "1/2 unidad", product: "APLANCHADO", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "1 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño", product: "POLLO ASADO", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "25 g" },
        { portion: "1 taza", product: "LECHUGA+ TOMATE", meal: "Almuerzo", keyNutrient: "Calcio", nutritionalValue: "30 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: SANDIA", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "24.31 mg" },
        { portion: "2 cdas harina de plátano + 1 guayaba", product: "COLADA DE HARINA DE PLATANO CON GUAYABA", meal: "Media Tarde", keyNutrient: "Potasio", nutritionalValue: "700 mg" }
    ],
    "12": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1 unidad pequeña", product: "TORTILLA DE MADURO", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "2 g" },
        { portion: "2 unidades", product: "KIWI", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "139 mg" },
        { portion: "1 taza", product: "PIÑA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "79.02 mg" },
        { portion: "1/3 taza", product: "HABAS COCINADAS", meal: "Media Mañana", keyNutrient: "Proteína", nutritionalValue: "1 g" },
        { portion: "1/3 taza", product: "QUINUA COCIDA", meal: "Almuerzo", keyNutrient: "Calcio", nutritionalValue: "20 mg" },
        { portion: "1/3 de frejol", product: "MENESTRA DE FREJOL", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "8 g" },
        { portion: "1/2 taza", product: "TOMATE + PEREJIL", meal: "Almuerzo", keyNutrient: "Calcio", nutritionalValue: "40 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: MELON", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "50 mg" },
        { portion: "1/3 taza", product: "MOTE", meal: "Media Tarde", keyNutrient: "Hierro", nutritionalValue: "30 mg" }
    ],
    "13": [
        { portion: "1/2 taza", product: "LECHE", meal: "Desayuno", keyNutrient: "Calcio", nutritionalValue: "150 mg" },
        { portion: "1/4 de unidad de verde", product: "MAJADO DE VERDE", meal: "Desayuno", keyNutrient: "Fibra", nutritionalValue: "2 g" },
        { portion: "1 taza", product: "FRESAS", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "89.04 mg" },
        { portion: "1 taza", product: "DURAZNO PICADO", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "50 mg" },
        { portion: "1/4 taza", product: "GRANOLA", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "2.5 g" },
        { portion: "1/3 taza", product: "ARROZ", meal: "Almuerzo", keyNutrient: "Carbohidratos", nutritionalValue: "23 g" },
        { portion: "1 filete pequeño", product: "SECO DE POLLO", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "25 g" },
        { portion: "1 taza", product: "COL MORADA+TOMATE", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "60 mg" },
        { portion: "1 taza", product: "PORCION DE FRUTA PICADA: UVAS", meal: "Almuerzo", keyNutrient: "Fibra", nutritionalValue: "0.8 g" },
        { portion: "1 unidad de tomate", product: "JUGO DE TOMATE DE ÁRBOL", meal: "Media Tarde", keyNutrient: "Vitaminas", nutritionalValue: "36.8 mg" },
        { portion: "1 unidad", product: "BISCOCHO", meal: "Media Tarde", keyNutrient: "Carbohidratos", nutritionalValue: "30 g" }
    ],
    "14": [
        { portion: "1/2 taza", product: "YOGURT", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "0.47 mg" },
        { portion: "1 unidad pequeña", product: "MUCHIN DE YUCA", meal: "Desayuno", keyNutrient: "Hierro", nutritionalValue: "40 mg" },
        { portion: "1 rodaja", product: "SANDIA", meal: "Desayuno", keyNutrient: "Vitaminas", nutritionalValue: "145 mg" },
        { portion: "1 taza", product: "PAPAYA", meal: "Media Mañana", keyNutrient: "Vitaminas", nutritionalValue: "102.6 mg" },
        { portion: "1/4 taza", product: "AVENA TOSTADA", meal: "Media Mañana", keyNutrient: "Fibra", nutritionalValue: "3 g" },
        { portion: "1/2 taza", product: "CAMOTE ASADO", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "1 g" },
        { portion: "1 huevo + 1/4 taza de pimientos", product: "TORTILLA DE HUEVO CON PIMIENTOS ROJOS", meal: "Almuerzo", keyNutrient: "Proteína", nutritionalValue: "8 g" },
        { portion: "1/2 taza", product: "ZUCCHINNI CON TOMATE", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "80 mg" },
        { portion: "1/2 unidad", product: "PORCION DE FRUTA PICADA: GUINEO", meal: "Almuerzo", keyNutrient: "Vitaminas", nutritionalValue: "19 mg" },
        { portion: "1/4 taza", product: "CHOCHOS", meal: "Media Tarde", keyNutrient: "Proteína", nutritionalValue: "0.6 g" }
    ],

};

app.post('/whatsapp', (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();
    const receivedMsg = req.body.Body.toLowerCase();
    const user = req.body.From;

    if (!userSessions[user]) {
        userSessions[user] = {
            step: 0,
            data: {},
            childrenCount: 0,
            currentChild: 0
        };
    }

    const session = userSessions[user];

    if (session.step === 0 && receivedMsg === 'hola') {
        twiml.message("Hola, soy ADHA y estoy aquí para ayudarte a cuidar la alimentación en tu hogar. Para empezar, responde estas breves preguntas.");
        session.step++;
    } else if (session.step === 1) {
        twiml.message("¿Cuál es tu edad?");
        session.step++;
    } else if (session.step === 2) {
        session.data.age = receivedMsg;
        twiml.message("¿Con qué género te identificas? Selecciona el número de la opción.\n1. Mujer\n2. Hombre\n3. Otro");
        session.step++;
    } else if (session.step === 3) {
        session.data.gender = receivedMsg;
        twiml.message("Cantón y parroquia dónde vives.");
        session.step++;
    } else if (session.step === 4) {
        session.data.location = receivedMsg;
        twiml.message("¿Cuántos hijos tienes?");
        session.step++;
    } else if (session.step === 5) {
        session.data.childrenCount = parseInt(receivedMsg);
        session.step++;
        if (session.data.childrenCount > 0) {
            twiml.message("¿Tu primer hijo es hombre o mujer?");
        } else {
            twiml.message("Gracias por responder las preguntas. ¿Cómo puedo ayudarte hoy?");
        }
    } else if (session.step > 5 && session.step <= 5 + session.data.childrenCount * 3) {
        const currentChild = Math.floor((session.step - 6) / 3) + 1;
        const childStep = (session.step - 6) % 3;

        if (childStep === 0) {
            session.data[`child${currentChild}`] = { gender: receivedMsg };
            twiml.message(`¿Cuántos años tiene tu ${currentChild === 1 ? 'primer' : currentChild === 2 ? 'segundo' : currentChild === 3 ? 'tercer' : `${currentChild}º`} hijo?`);
        } else if (childStep === 1) {
            session.data[`child${currentChild}`].age = receivedMsg;
            if (parseInt(receivedMsg) <= 3) {
                twiml.message(`¿Tu hijo/a asiste a un centro de desarrollo infantil o recibe atención de una especialista en tu hogar?\n1. Si\n2. No`);
            } else {
                twiml.message(`¿Tu hijo/a va a la escuela?\n1. Si\n2. No`);
            }
        } else if (childStep === 2) {
            session.data[`child${currentChild}`].attendance = receivedMsg;
            if (parseInt(session.data[`child${currentChild}`].age) <= 3) {
                twiml.message(`¿Llevas a tu hijo/a a los controles médicos en el centro de salud u hospital?\n1. Si\n2. No`);
            } else {
                if (currentChild < session.data.childrenCount) {
                    twiml.message(`¿Tu ${currentChild + 1}º hijo es hombre o mujer?`);
                } else {
                    twiml.message("Gracias por responder las preguntas. ¿Cómo puedo ayudarte hoy?");
                    session.step = 6 + session.data.childrenCount * 3; // Move to the next part of the conversation flow
                }
            }
        }
        session.step++;
    } else if (session.step === 6 + session.data.childrenCount * 3) {
        if (receivedMsg === '1' || receivedMsg === '2') {
            twiml.message("Selecciona el número de la categoría que te interese:\n1. Menús por día\n2. Menús por productos\n3. Menús por nutrientes\n4. Menús de desayuno\n6. Opciones de media mañana\n7. Menús de almuerzo\n8. Opciones de media tarde\n9. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '3') {
            twiml.message("MENSAJES DE LACTANCIA");
        } else {
            twiml.message('Opción no válida. Selecciona el número de la categoría que te interese:\n1. Menús para bebés de 1 - 2 años\n2. Menús para bebés de 3 años\n3. Alimentación para bebés de 0 - 12 meses');
        }
    } else if (session.step === 7 + session.data.childrenCount * 3) {
        if (receivedMsg === '1') {
            twiml.message("Selecciona el número de cada menú para verlo:\n1. Menu 1\n2. Menu 2\n3. Menu 3\n4. Menu 4\n5. Menu 5\n6. Menu 6\n7. Menu 7\n8. Menu 8\n9. Menu 9\n10. Menu 10\n11. Menu 11\n12. Menu 12\n13. Menu 13\n14. Menu 14\n15. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '2') {
            twiml.message("Selecciona el número de cada producto para ver los menús:\n1. Leche\n2. Tortilla de Verde\n3. Mandarina\n4. Naranja\n5. Habas\n6. Papa\n7. Huevo\n8. Espinaca\n9. Tomate\n10. Limón\n11. Perejil\n12. Sandía\n13. Avena\n14. Uvas\n15. Manzana\n16. Galletas\n17. Arroz\n18. Carne\n19. Aguacate\n20. Tomate de árbol\n21. Maicena\n22. Guayaba\n23. Yogurt\n24. Granola\n25. Melón\n26. Frejol\n27. Zucchini\n28. Fresa\n29. Kiwi\n30. Papaya\n31. Nueces\n32. Pollo\n33. Quinua\n34. Brócoli\n35. Piña\n36. Chochos\n37. Tostado\n38. Queso\n39. Berenjena\n40. Yuca\n41. Zanahoria\n42. Albahaca\n43. Mora\n44. Guineo\n45. Choclo\n46. Mote\n47. Biscocho\n48. Remolacha\n49. Acelga\n50. Maní\n51. Canguil\n52. Hígado\n53. Vainita\n54. Almendras\n55. Aplanchado\n56. Durazno\n57. Col morada\n58. Curtido\n59. Camote\n60. Melloco\n61. Muchin de yuca\n62. Harina de plátano\n63. Papaya");
            session.step++;
        } else if (receivedMsg === '3') {
            twiml.message("Selecciona el número de cada nutriente para ver los menús:\n1. Calcio\n2. Fibra\n3. Vitaminas\n4. Proteína\n5. Carbohidratos\n6. Hierro\n7. Zinc\n8. Potasio");
            session.step++;
        } else if (receivedMsg === '4') {
            twiml.message("Selecciona el número de cada desayuno para verlo:\n1. Desayuno 1\n2. Desayuno 2\n3. Desayuno 3\n4. Desayuno 4\n5. Desayuno 5\n6. Desayuno 6\n7. Desayuno 7\n8. Desayuno 8\n9. Desayuno 9\n10. Desayuno 10\n11. Desayuno 11\n12. Desayuno 12\n13. Desayuno 13\n14. Desayuno 14\n15. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '6') {
            twiml.message("Selecciona el número de cada opción de media mañana para verla:\n1. Media mañana 1\n2. Media mañana 2\n3. Media mañana 3\n4. Media mañana 4\n5. Media mañana 5\n6. Media mañana 6\n7. Media mañana 7\n8. Media mañana 8\n9. Media mañana 9\n10. Media mañana 10\n11. Media mañana 11\n12. Media mañana 12\n13. Media mañana 13\n14. Media mañana 14\n15. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '7') {
            twiml.message("Selecciona el número de cada almuerzo para verlo:\n1. Almuerzo 1\n2. Almuerzo 2\n3. Almuerzo 3\n4. Almuerzo 4\n5. Almuerzo 5\n6. Almuerzo 6\n7. Almuerzo 7\n8. Almuerzo 8\n9. Almuerzo 9\n10. Almuerzo 10\n11. Almuerzo 11\n12. Almuerzo 12\n13. Almuerzo 13\n14. Almuerzo 14\n15. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '8') {
            twiml.message("Selecciona el número de cada opción de media tarde para verla:\n1. Media tarde 1\n2. Media tarde 2\n3. Media tarde 3\n4. Media tarde 4\n5. Media tarde 5\n6. Media tarde 6\n7. Media tarde 7\n8. Media tarde 8\n9. Media tarde 9\n10. Media tarde 10\n11. Media tarde 11\n12. Media tarde 12\n13. Media tarde 13\n14. Media tarde 14\n15. Volver a la pregunta anterior (back to previous question)");
            session.step++;
        } else if (receivedMsg === '9') {
            session.step--;
            twiml.message("Selecciona el número de la categoría que te interese:\n1. Menús por día\n2. Menús por productos\n3. Menús por nutrientes\n4. Menús de desayuno\n6. Opciones de media mañana\n7. Menús de almuerzo\n8. Opciones de media tarde\n9. Volver a la pregunta anterior (back to previous question)");
        } else {
            twiml.message("Opción no válida. Selecciona el número de la categoría que te interese:\n1. Menús por día\n2. Menús por productos\n3. Menús por nutrientes\n4. Menús de desayuno\n6. Opciones de media mañana\n7. Menús de almuerzo\n8. Opciones de media tarde\n9. Volver a la pregunta anterior (back to previous question)");
        }
    } else if (session.step === 8 + session.data.childrenCount * 3) {
        if (menus[receivedMsg]) {
            let menuResponse = `Menú ${receivedMsg}:\n`;
            menus[receivedMsg].forEach(item => {
                menuResponse += `${item.portion} de ${item.product} (${item.meal}) - ${item.keyNutrient}: ${item.nutritionalValue}\n`;
            });
            twiml.message(menuResponse);
        } else {
            twiml.message("Opción no válida. Selecciona el número de cada menú para verlo:\n1. Menu 1\n2. Menu 2\n3. Menu 3\n4. Menu 4\n5. Menu 5\n6. Menu 6\n7. Menu 7\n8. Menu 8\n9. Menu 9\n10. Menu 10\n11. Menu 11\n12. Menu 12\n13. Menu 13\n14. Menu 14\n15. Volver a la pregunta anterior (back to previous question)");
        }
    }

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
    