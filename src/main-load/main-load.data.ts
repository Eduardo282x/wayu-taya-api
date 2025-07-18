export interface Location {
    iso_31662: string;
    estado: string;
    capital: string;
    id_estado: number;
    municipios: Municipio[];
    ciudades: string[];
}

interface Municipio {
    municipio: string;
    capital: string;
    parroquias: string[];
}

export const locations: Location[] = [
    {
        iso_31662: "VE-X",
        estado: "Amazonas",
        capital: "Puerto Ayacucho",
        id_estado: 1,
        municipios: [
            {
                municipio: "Alto Orinoco",
                capital: "La Esmeralda",
                parroquias: [
                    "Alto Orinoco La Esmeralda",
                    "Huachamacare Acanaña",
                    "Marawaka Toky Shamanaña",
                    "Mavaka Mavaka",
                    "Sierra Parima Parimabé"
                ]
            },
            {
                municipio: "Atabapo",
                capital: "San Fernando de Atabapo",
                parroquias: [
                    "Ucata Laja Lisa",
                    "Yapacana Macuruco",
                    "Caname Guarinuma"
                ]
            },
            {
                municipio: "Atures",
                capital: "Puerto Ayacucho",
                parroquias: [
                    "Fernando Girón Tovar",
                    "Luis Alberto Gómez",
                    "Pahueña Limón de Parhueña",
                    "Platanillal Platanillal"
                ]
            },
            {
                municipio: "Autana",
                capital: "Isla Ratón",
                parroquias: [
                    "Samariapo Samariapo",
                    "Sipapo Pendare",
                    "Munduapo Munduapo",
                    "Guayapo San Pedro del Orinoco"
                ]
            },
            {
                municipio: "Manapiare",
                capital: "San Juan de Manapiare",
                parroquias: [
                    "Alto Ventuari Cacurí",
                    "Medio Ventuari Manami",
                    "Bajo Ventuari Marueta"
                ]
            },
            {
                municipio: "Maroa",
                capital: "Maroa",
                parroquias: [
                    "Victorino",
                    "Comunidad"
                ]
            },
            {
                municipio: "Río Negro",
                capital: "San Carlos de Río Negro",
                parroquias: [
                    "Casiquiare Curimacare",
                    "Cocuy",
                    "San Carlos de Río Negro",
                    "Solano Solano"
                ]
            }
        ],
        ciudades: [
            "Maroa",
            "Puerto Ayacucho",
            "San Fernando de Atabapo"
        ]
    },
    {
        iso_31662: "VE-B",
        estado: "Anzoátegui",
        capital: "Barcelona",
        id_estado: 2,
        municipios: [
            {
                municipio: "Anaco",
                capital: "Anaco",
                parroquias: [
                    "Anaco",
                    "San Joaquín"
                ]
            },
            {
                municipio: "Aragua",
                capital: "Aragua de Barcelona",
                parroquias: [
                    "Cachipo",
                    "Aragua de Barcelona"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Barcelona",
                parroquias: [
                    "Bergatín",
                    "Caigua",
                    "El Carmen.",
                    "El Pilar",
                    "Naricual.",
                    "San Cristóbal"
                ]
            },
            {
                municipio: "Bruzual",
                capital: "Clarines",
                parroquias: [
                    "Clarines",
                    "Guanape",
                    "Sabana de Uchire"
                ]
            },
            {
                municipio: "Cajigal",
                capital: "Onoto",
                parroquias: [
                    "Onoto",
                    "San Pablo"
                ]
            },
            {
                municipio: "Carvajal",
                capital: "Valle de Guanape",
                parroquias: [
                    "Valle de Guanape",
                    "Santa Bárbara"
                ]
            },
            {
                municipio: "Diego Bautista Urbaneja",
                capital: "Lechería",
                parroquias: [
                    "Lechería",
                    "El Morro"
                ]
            },
            {
                municipio: "Freites",
                capital: "Cantaura",
                parroquias: [
                    "Cantaura",
                    "Libertador",
                    "Santa Rosa",
                    "Urica"
                ]
            },
            {
                municipio: "Guanipa",
                capital: "San José de Guanipa",
                parroquias: [
                    "San José de Guanipa"
                ]
            },
            {
                municipio: "Guanta",
                capital: "Guanta",
                parroquias: [
                    "Guanta",
                    "Chorrerón"
                ]
            },
            {
                municipio: "Independencia",
                capital: "Soledad",
                parroquias: [
                    "Mamo",
                    "Soledad"
                ]
            },
            {
                municipio: "Libertad",
                capital: "San Mateo",
                parroquias: [
                    "San Mateo",
                    "El Carito",
                    "Santa Inés",
                    "La Romereña"
                ]
            },
            {
                municipio: "McGregor",
                capital: "El Chaparro",
                parroquias: [
                    "El Chaparro",
                    "Tomás Alfaro",
                    "Calatrava"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Pariaguán",
                parroquias: [
                    "Atapirire",
                    "Boca del Pao",
                    "El Pao",
                    "Pariaguán"
                ]
            },
            {
                municipio: "Monagas",
                capital: "Mapire",
                parroquias: [
                    "Mapire",
                    "Piar",
                    "Santa Clara",
                    "San Diego de Cabrutica",
                    "Uverito",
                    "Zuata"
                ]
            },
            {
                municipio: "Peñalver",
                capital: "Puerto Píritu",
                parroquias: [
                    "Puerto Píritu",
                    "San Miguel",
                    "Sucre"
                ]
            },
            {
                municipio: "Píritu",
                capital: "Píritu",
                parroquias: [
                    "Píritu",
                    "San Francisco"
                ]
            },
            {
                municipio: "San Juan de Capistrano",
                capital: "Boca de Uchire",
                parroquias: [
                    "Boca de Uchire",
                    "Boca de Chávez"
                ]
            },
            {
                municipio: "Santa Ana",
                capital: "Santa Ana",
                parroquias: [
                    "Pueblo Nuevo",
                    "Santa Ana"
                ]
            },
            {
                municipio: "Simón Rodríguez",
                capital: "El Tigre",
                parroquias: [
                    "Edmundo Barrios",
                    "Miguel Otero Silva"
                ]
            },
            {
                municipio: "Sotillo",
                capital: "Puerto La Cruz",
                parroquias: [
                    "Puerto La Cruz",
                    "Pozuelos"
                ]
            }
        ],
        ciudades: [
            "Anaco",
            "Aragua de Barcelona",
            "Barcelona",
            "Boca de Uchire",
            "Cantaura",
            "Clarines",
            "El Chaparro",
            "El Pao Anzoátegui",
            "El Tigre",
            "El Tigrito",
            "Guanape",
            "Guanta",
            "Lechería",
            "Onoto",
            "Pariaguán",
            "Píritu",
            "Puerto La Cruz",
            "Puerto Píritu",
            "Sabana de Uchire",
            "San Mateo Anzoátegui",
            "San Pablo Anzoátegui",
            "San Tomé",
            "Santa Ana de Anzoátegui",
            "Santa Fe Anzoátegui",
            "Santa Rosa",
            "Soledad",
            "Urica",
            "Valle de Guanape"
        ]
    },
    {
        iso_31662: "VE-C",
        estado: "Apure",
        capital: "San Fernando de Apure",
        id_estado: 3,
        municipios: [
            {
                municipio: "Achaguas",
                capital: "Achaguas",
                parroquias: [
                    "Achaguas",
                    "Apurito",
                    "El Yagual",
                    "Guachara",
                    "Mucuritas",
                    "Queseras del medio"
                ]
            },
            {
                municipio: "Biruaca",
                capital: "Biruaca",
                parroquias: [
                    "Biruaca"
                ]
            },
            {
                municipio: "Muñoz",
                capital: "Bruzual",
                parroquias: [
                    "Bruzual",
                    "Mantecal",
                    "Quintero",
                    "Rincón Hondo",
                    "San Vicente"
                ]
            },
            {
                municipio: "Páez",
                capital: "Guasdualito",
                parroquias: [
                    "Guasdualito",
                    "Aramendi",
                    "El Amparo",
                    "San Camilo",
                    "Urdaneta"
                ]
            },
            {
                municipio: "Pedro Camejo",
                capital: "San Juan de Payara",
                parroquias: [
                    "San Juan de Payara",
                    "Codazzi",
                    "Cunaviche"
                ]
            },
            {
                municipio: "Rómulo Gallegos",
                capital: "Elorza",
                parroquias: [
                    "Elorza",
                    "La Trinidad"
                ]
            },
            {
                municipio: "San Fernando",
                capital: "San Fernando de Apure",
                parroquias: [
                    "San Fernando",
                    "El Recreo",
                    "Peñalver",
                    "San Rafael de Atamaica"
                ]
            }
        ],
        ciudades: [
            "Achaguas",
            "Biruaca",
            "Bruzual",
            "El Amparo",
            "El Nula",
            "Elorza",
            "Guasdualito",
            "Mantecal",
            "Puerto Páez",
            "San Fernando de Apure",
            "San Juan de Payara"
        ]
    },
    {
        iso_31662: "VE-D",
        estado: "Aragua",
        capital: "Maracay",
        id_estado: 4,
        municipios: [
            {
                municipio: "Bolívar",
                capital: "San Mateo",
                parroquias: [
                    "Bolívar"
                ]
            },
            {
                municipio: "Camatagua",
                capital: "Camatagua",
                parroquias: [
                    "Camatagua",
                    "Carmen de Cura"
                ]
            },
            {
                municipio: "Francisco Linares Alcántara",
                capital: "Santa Rita",
                parroquias: [
                    "Santa Rita",
                    "Francisco de Miranda",
                    "Moseñor Feliciano González"
                ]
            },
            {
                municipio: "Girardot",
                capital: "Maracay",
                parroquias: [
                    "Pedro José Ovalles",
                    "Joaquín Crespo",
                    "José Casanova Godoy",
                    "Madre María de San José",
                    "Andrés Eloy Blanco",
                    "Los Tacarigua",
                    "Las Delicias",
                    "Choroní"
                ]
            },
            {
                municipio: "José Ángel Lamas",
                capital: "Santa Cruz de Aragua",
                parroquias: [
                    "Santa Cruz"
                ]
            },
            {
                municipio: "José Félix Ribas",
                capital: "La Victoria",
                parroquias: [
                    "José Félix Ribas",
                    "Castor Nieves Ríos",
                    "Las Guacamayas",
                    "Pao de Zárate",
                    "Zuata"
                ]
            },
            {
                municipio: "José Rafael Revenga",
                capital: "El Consejo",
                parroquias: [
                    "José Rafael Revenga"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Palo Negro",
                parroquias: [
                    "Palo Negro",
                    "San Martín de Porres"
                ]
            },
            {
                municipio: "Mario Briceño Iragorry",
                capital: "El Limón",
                parroquias: [
                    "El Limón",
                    "Caña de Azúcar"
                ]
            },
            {
                municipio: "Ocumare de la Costa de Oro",
                capital: "Ocumare de la Costa",
                parroquias: [
                    "Ocumare de la Costa"
                ]
            },
            {
                municipio: "San Casimiro",
                capital: "San Casimiro",
                parroquias: [
                    "San Casimiro",
                    "Güiripa",
                    "Ollas de Caramacate",
                    "Valle Morín"
                ]
            },
            {
                municipio: "San Sebastián",
                capital: "San Sebastián de Los Reyes",
                parroquias: [
                    "San Sebastián"
                ]
            },
            {
                municipio: "Santiago Mariño",
                capital: "Turmero",
                parroquias: [
                    "Turmero",
                    "Arevalo Aponte",
                    "Chuao",
                    "Samán de Güere",
                    "Alfredo Pacheco Miranda"
                ]
            },
            {
                municipio: "Santos Michelena",
                capital: "Las Tejerías",
                parroquias: [
                    "Santos Michelena",
                    "Tiara"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Cagua",
                parroquias: [
                    "Cagua",
                    "Bella Vista"
                ]
            },
            {
                municipio: "Tovar",
                capital: "Colonia Tovar",
                parroquias: [
                    "Tovar"
                ]
            },
            {
                municipio: "Urdaneta",
                capital: "Barbacoas",
                parroquias: [
                    "Urdaneta",
                    "Las Peñitas",
                    "San Francisco de Cara",
                    "Taguay"
                ]
            },
            {
                municipio: "Zamora",
                capital: "Villa de Cura",
                parroquias: [
                    "Zamora",
                    "Magdaleno",
                    "San Francisco de Asís",
                    "Valles de Tucutunemo",
                    "Augusto Mijares"
                ]
            }
        ],
        ciudades: [
            "Barbacoas",
            "Cagua",
            "Camatagua",
            "Choroní",
            "Colonia Tovar",
            "El Consejo",
            "La Victoria",
            "Las Tejerías",
            "Magdaleno",
            "Maracay",
            "Ocumare de La Costa",
            "Palo Negro",
            "San Casimiro",
            "San Mateo",
            "San Sebastián",
            "Santa Cruz de Aragua",
            "Tocorón",
            "Turmero",
            "Villa de Cura",
            "Zuata"
        ]
    },
    {
        iso_31662: "VE-E",
        estado: "Barinas",
        capital: "Barinas",
        id_estado: 5,
        municipios: [
            {
                municipio: "Alberto Arvelo Torrealba",
                capital: "Sabaneta",
                parroquias: [
                    "Sabaneta",
                    "Juan Antonio Rodríguez Domínguez"
                ]
            },
            {
                municipio: "Andrés Eloy Blanco",
                capital: "El Cantón",
                parroquias: [
                    "El Cantón",
                    "Santa Cruz de Guacas",
                    "Puerto Vivas"
                ]
            },
            {
                municipio: "Antonio José de Sucre",
                capital: "Socopó",
                parroquias: [
                    "Ticoporo",
                    "Nicolás Pulido",
                    "Andrés Bello"
                ]
            },
            {
                municipio: "Arismendi",
                capital: "Arismendi",
                parroquias: [
                    "Arismendi",
                    "Guadarrama",
                    "La Unión",
                    "San Antonio"
                ]
            },
            {
                municipio: "Barinas",
                capital: "Barinas",
                parroquias: [
                    "Barinas",
                    "Alberto Arvelo Larriva",
                    "San Silvestre",
                    "Santa Inés",
                    "Santa Lucía",
                    "Torunos",
                    "El Carmen",
                    "Rómulo Betancourt",
                    "Corazón de Jesús",
                    "Ramón Ignacio Méndez",
                    "Alto Barinas",
                    "Manuel Palacio Fajardo",
                    "Juan Antonio Rodríguez Domínguez",
                    "Dominga Ortiz de Páez"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Barinitas",
                parroquias: [
                    "Barinitas",
                    "Altamira de Cáceres",
                    "Calderas"
                ]
            },
            {
                municipio: "Cruz Paredes",
                capital: "Barrancas",
                parroquias: [
                    "Barrancas",
                    "El Socorro",
                    "Mazparrito"
                ]
            },
            {
                municipio: "Ezequiel Zamora",
                capital: "Santa Bárbara",
                parroquias: [
                    "Santa Bárbara",
                    "Pedro Briceño Méndez",
                    "Ramón Ignacio Méndez",
                    "José Ignacio del Pumar"
                ]
            },
            {
                municipio: "Obispos",
                capital: "Obispos",
                parroquias: [
                    "Obispos",
                    "Los Guasimitos",
                    "El Real",
                    "La Luz"
                ]
            },
            {
                municipio: "Pedraza",
                capital: "Ciudad Bolivia",
                parroquias: [
                    "Ciudad Bolívia",
                    "José Ignacio Briceño",
                    "José Félix Ribas",
                    "Páez"
                ]
            },
            {
                municipio: "Rojas",
                capital: "Libertad",
                parroquias: [
                    "Libertad",
                    "Dolores",
                    "Santa Rosa",
                    "Palacio Fajardo",
                    "Simón Rodríguez"
                ]
            },
            {
                municipio: "Sosa",
                capital: "Ciudad de Nutrias",
                parroquias: [
                    "Ciudad de Nutrias",
                    "El Regalo",
                    "Puerto Nutrias",
                    "Santa Catalina",
                    "Simón Bolívar"
                ]
            }
        ],
        ciudades: [
            "Barinas",
            "Barinitas",
            "Barrancas",
            "Calderas",
            "Capitanejo",
            "Ciudad Bolivia",
            "El Cantón",
            "Las Veguitas",
            "Libertad de Barinas",
            "Sabaneta",
            "Santa Bárbara de Barinas",
            "Socopó"
        ]
    },
    {
        iso_31662: "VE-F",
        estado: "Bolívar",
        capital: "Ciudad Bolívar",
        id_estado: 6,
        municipios: [
            {
                municipio: "Angostura",
                capital: "Ciudad Píar",
                parroquias: [
                    "Raúl Leoni",
                    "Barceloneta",
                    "Santa Bárbara",
                    "San Francisco"
                ]
            },
            {
                municipio: "Caroní",
                capital: "Ciudad Guayana",
                parroquias: [
                    "Cachamay",
                    "Chirica",
                    "Dalla Costa",
                    "Once de Abril",
                    "Simón Bolívar",
                    "Unare",
                    "Universidad",
                    "Vista al Sol",
                    "Pozo Verde",
                    "Yocoima",
                    "5 de Julio"
                ]
            },
            {
                municipio: "Cedeño",
                capital: "Caicara del Orinoco",
                parroquias: [
                    "Cedeño",
                    "Altagracia",
                    "Ascensión Farreras",
                    "Guaniamo",
                    "La Urbana",
                    "Pijiguaos"
                ]
            },
            {
                municipio: "El Callao",
                capital: "El Callao",
                parroquias: [
                    "El Callao"
                ]
            },
            {
                municipio: "Gran Sabana",
                capital: "Santa Elena de Uairén",
                parroquias: [
                    "Gran Sabana",
                    "Ikabarú"
                ]
            },
            {
                municipio: "Heres",
                capital: "Ciudad Bolívar",
                parroquias: [
                    "Catedral",
                    "Zea",
                    "Orinoco",
                    "José Antonio Páez",
                    "Marhuanta",
                    "Agua Salada",
                    "Vista Hermosa",
                    "La Sabanita",
                    "Panapana"
                ]
            },
            {
                municipio: "Píar",
                capital: "Upata",
                parroquias: [
                    "Andrés Eloy Blanco",
                    "Pedro Cova"
                ]
            },
            {
                municipio: "Roscio",
                capital: "Guasipati",
                parroquias: [
                    "Roscio",
                    "Salóm"
                ]
            },
            {
                municipio: "Sifontes",
                capital: "El Dorado",
                parroquias: [
                    "Sifontes",
                    "Dalla Costa",
                    "San Isidro"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Maripa",
                parroquias: [
                    "Sucre",
                    "Aripao",
                    "Guarataro",
                    "Las Majadas",
                    "Moitaco"
                ]
            },
            {
                municipio: "Padre Pedro Chien",
                capital: "El Palmar",
                parroquias: [
                    "Padre Pedro Chien",
                    "Río Grande"
                ]
            }
        ],
        ciudades: [
            "Caicara del Orinoco",
            "Canaima",
            "Ciudad Bolívar",
            "Ciudad Piar",
            "El Callao",
            "El Dorado",
            "El Manteco",
            "El Palmar",
            "El Pao",
            "Guasipati",
            "Guri",
            "La Paragua",
            "Matanzas",
            "Puerto Ordaz",
            "San Félix",
            "Santa Elena de Uairén",
            "Tumeremo",
            "Unare",
            "Upata"
        ]
    },
    {
        iso_31662: "VE-G",
        estado: "Carabobo",
        capital: "Valencia",
        id_estado: 7,
        municipios: [
            {
                municipio: "Bejuma",
                capital: "Bejuma",
                parroquias: [
                    "Bejuma",
                    "Canoabo",
                    "Simón Bolívar"
                ]
            },
            {
                municipio: "Carlos Arvelo",
                capital: "Güigüe",
                parroquias: [
                    "Güigüe",
                    "Carabobo",
                    "Tacarigua"
                ]
            },
            {
                municipio: "Diego Ibarra",
                capital: "Mariara",
                parroquias: [
                    "Mariara",
                    "Aguas Calientes"
                ]
            },
            {
                municipio: "Guacara",
                capital: "Guacara",
                parroquias: [
                    "Ciudad Alianza",
                    "Guacara",
                    "Yagua"
                ]
            },
            {
                municipio: "Mora",
                capital: "Morón",
                parroquias: [
                    "Morón",
                    "Urama"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Tocuyito",
                parroquias: [
                    "Valencia",
                    "Campo Carabobo"
                ]
            },
            {
                municipio: "Los Guayos",
                capital: "Los Guayos",
                parroquias: [
                    "Los Guayos"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Miranda",
                parroquias: [
                    "Miranda"
                ]
            },
            {
                municipio: "Montalbán",
                capital: "Montalbán",
                parroquias: [
                    "Montalbán"
                ]
            },
            {
                municipio: "Naguanagua",
                capital: "Naguanagua",
                parroquias: [
                    "Naguanagua"
                ]
            },
            {
                municipio: "Puerto Cabello",
                capital: "Puerto Cabello",
                parroquias: [
                    "Bartolomé Salóm",
                    "Democracia",
                    "Fraternidad",
                    "Goaigoaza",
                    "Juan José Flores",
                    "Unión",
                    "Borburata",
                    "Patanemo"
                ]
            },
            {
                municipio: "San Diego",
                capital: "San Diego",
                parroquias: [
                    "San Diego"
                ]
            },
            {
                municipio: "San Joaquín",
                capital: "San Joaquín",
                parroquias: [
                    "San Joaquín"
                ]
            },
            {
                municipio: "Valencia",
                capital: "Valencia",
                parroquias: [
                    "Urbana Candelaria",
                    "Urbana Catedral",
                    "Urbana El Socorro",
                    "Urbana Miguel Peña",
                    "Urbana Rafael Urdaneta",
                    "Urbana San Blas",
                    "Urbana San José",
                    "Urbana Santa Rosa",
                    "No Urbana Negro Primero"
                ]
            }
        ],
        ciudades: [
            "Bejuma",
            "Belén",
            "Campo de Carabobo",
            "Canoabo",
            "Central Tacarigua",
            "Chirgua",
            "Ciudad Alianza",
            "El Palito",
            "Guacara",
            "Guigue",
            "Las Trincheras",
            "Los Guayos",
            "Mariara",
            "Miranda",
            "Montalbán",
            "Morón",
            "Naguanagua",
            "Puerto Cabello",
            "San Joaquín",
            "Tocuyito",
            "Urama",
            "Valencia",
            "Vigirimita"
        ]
    },
    {
        iso_31662: "VE-H",
        estado: "Cojedes",
        capital: "San Carlos",
        id_estado: 8,
        municipios: [
            {
                municipio: "Anzoátegui",
                capital: "Cojedes",
                parroquias: [
                    "Cojedes",
                    "Juan de Mata Suárez"
                ]
            },
            {
                municipio: "Tinaquillo",
                capital: "Tinaquillo",
                parroquias: [
                    "Tinaquillo"
                ]
            },
            {
                municipio: "Girardot",
                capital: "El Baúl",
                parroquias: [
                    "El Baúl",
                    "Sucre"
                ]
            },
            {
                municipio: "Lima Blanco",
                capital: "Macapo",
                parroquias: [
                    "La Aguadita",
                    "Macapo"
                ]
            },
            {
                municipio: "Pao de San Juan Bautista",
                capital: "El Pao",
                parroquias: [
                    "El Pao"
                ]
            },
            {
                municipio: "Ricaurte",
                capital: "Libertad",
                parroquias: [
                    "El Amparo",
                    "Libertad de Cojedes"
                ]
            },
            {
                municipio: "Rómulo Gallegos",
                capital: "Las Vegas",
                parroquias: [
                    "Rómulo Gallegos"
                ]
            },
            {
                municipio: "San Carlos",
                capital: "San Carlos",
                parroquias: [
                    "San Carlos de Austria",
                    "Juan Ángel Bravo",
                    "Manuel Manrique"
                ]
            },
            {
                municipio: "Tinaco",
                capital: "Tinaco",
                parroquias: [
                    "General en Jefe José Laurencio Silva"
                ]
            }
        ],
        ciudades: [
            "Aguirre",
            "Apartaderos Cojedes",
            "Arismendi",
            "Camuriquito",
            "El Baúl",
            "El Limón",
            "El Pao Cojedes",
            "El Socorro",
            "La Aguadita",
            "Las Vegas",
            "Libertad de Cojedes",
            "Mapuey",
            "Piñedo",
            "Samancito",
            "San Carlos",
            "Sucre",
            "Tinaco",
            "Tinaquillo",
            "Vallecito"
        ]
    },
    {
        iso_31662: "VE-Y",
        estado: "Delta Amacuro",
        capital: "Tucupita",
        id_estado: 9,
        municipios: [
            {
                municipio: "Antonio Díaz",
                capital: "Curiapo",
                parroquias: [
                    "Curiapo",
                    "Almirante Luis Brión",
                    "Francisco Aniceto Lugo Boca de Cuyubini",
                    "Manuel Renaud",
                    "Padre Barral",
                    "Santos de Abelgas"
                ]
            },
            {
                municipio: "Casacoima",
                capital: "Sierra Imataca",
                parroquias: [
                    "Imataca Moruca",
                    "Cinco de Julio Piacoa",
                    "Juan Bautista Arismendi",
                    "Manuel Piar Santa Catalina",
                    "Rómulo Gallegos"
                ]
            },
            {
                municipio: "Pedernales",
                capital: "Pedernales",
                parroquias: [
                    "Pedernales",
                    "Luis Beltrán Prieto Figueroa"
                ]
            },
            {
                municipio: "Tucupita",
                capital: "Tucupita",
                parroquias: [
                    "San José",
                    "José Vidal Marcano Caparal de Guara",
                    "Juan Millán",
                    "Leonardo Ruíz Pineda Paloma",
                    "Mariscal Antonio José de Sucre",
                    "Monseñor Argimiro García San Rafael",
                    "San Rafael",
                    "Virgen del Valle"
                ]
            }
        ],
        ciudades: [
            "Tucupita"
        ]
    },
    {
        iso_31662: "VE-I",
        estado: "Falcón",
        capital: "Coro",
        id_estado: 10,
        municipios: [
            {
                municipio: "Acosta",
                capital: "San Juan de los Cayos",
                parroquias: [
                    "Capadare",
                    "La Pastora",
                    "Libertador",
                    "San Juan de los Cayos"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "San Luis",
                parroquias: [
                    "Aracua",
                    "La Peña",
                    "San Luis"
                ]
            },
            {
                municipio: "Buchivacoa",
                capital: "Capatárida",
                parroquias: [
                    "Bariro",
                    "Borojó",
                    "Capatárida",
                    "Guajiro",
                    "Seque",
                    "Zazárida",
                    "Valle de Eroa"
                ]
            },
            {
                municipio: "Carirubana",
                capital: "Punto Fijo",
                parroquias: [
                    "Norte",
                    "Carirubana",
                    "Santa Ana",
                    "Urbana Punta Cardón"
                ]
            },
            {
                municipio: "Colina",
                capital: "La Vela de Coro",
                parroquias: [
                    "La Vela de Coro",
                    "Acurigua",
                    "Guaibacoa",
                    "Las Calderas",
                    "Macoruca"
                ]
            },
            {
                municipio: "Dabajuro",
                capital: "Dabajuro",
                parroquias: [
                    "Dabajuro"
                ]
            },
            {
                municipio: "Democracia",
                capital: "Pedregal",
                parroquias: [
                    "Agua Clara",
                    "Avaria",
                    "Pedregal",
                    "Piedra Grande",
                    "Purureche"
                ]
            },
            {
                municipio: "Falcón",
                capital: "Pueblo Nuevo",
                parroquias: [
                    "Adaure",
                    "Adícora",
                    "Baraived",
                    "Buena Vista",
                    "Jadacaquiva",
                    "El Vínculo",
                    "El Hato",
                    "Moruy",
                    "Pueblo Nuevo"
                ]
            },
            {
                municipio: "Federación",
                capital: "Churuguara",
                parroquias: [
                    "Agua Larga",
                    "Churuguara",
                    "El Paují",
                    "Independencia",
                    "Mapararí"
                ]
            },
            {
                municipio: "Jacura",
                capital: "Jacura",
                parroquias: [
                    "Agua Linda",
                    "Araurima",
                    "Jacura"
                ]
            },
            {
                municipio: "Los Taques",
                capital: "Santa Cruz de Los Taques",
                parroquias: [
                    "Los Taques",
                    "Judibana"
                ]
            },
            {
                municipio: "Manaure",
                capital: "Yaracal",
                parroquias: [
                    "Cacique Manaure"
                ]
            },
            {
                municipio: "Mauroa",
                capital: "Mene de Mauroa",
                parroquias: [
                    "Mene de Mauroa",
                    "San Félix",
                    "Casigua"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Santa Ana de Coro",
                parroquias: [
                    "Guzmán Guillermo",
                    "Mitare",
                    "Río Seco",
                    "Sabaneta",
                    "San Antonio",
                    "San Gabriel",
                    "Santa Ana"
                ]
            },
            {
                municipio: "Monseñor Iturriza",
                capital: "Chichiriviche",
                parroquias: [
                    "Boca del Tocuyo",
                    "Chichiriviche",
                    "Tocuyo de la Costa"
                ]
            },
            {
                municipio: "Palmasola",
                capital: "Palmasola",
                parroquias: [
                    "Palmasola"
                ]
            },
            {
                municipio: "Petit",
                capital: "Cabure",
                parroquias: [
                    "Cabure",
                    "Colina",
                    "Curimagua"
                ]
            },
            {
                municipio: "Píritu",
                capital: "Píritu",
                parroquias: [
                    "San José de la Costa",
                    "Píritu"
                ]
            },
            {
                municipio: "San Francisco",
                capital: "Mirimire",
                parroquias: [
                    "Capital San Francisco"
                ]
            },
            {
                municipio: "Sucre",
                capital: "La Cruz de Taratara",
                parroquias: [
                    "Sucre",
                    "Pecaya"
                ]
            },
            {
                municipio: "Silva",
                capital: "Tucacas",
                parroquias: [
                    "Tucacas",
                    "Boca de Aroa"
                ]
            },
            {
                municipio: "Tocópero",
                capital: "Tocópero",
                parroquias: [
                    "Tocópero"
                ]
            },
            {
                municipio: "Unión",
                capital: "Santa Cruz de Bucaral",
                parroquias: [
                    "El Charal",
                    "Las Vegas del Tuy",
                    "Santa Cruz de Bucaral"
                ]
            },
            {
                municipio: "Urumaco",
                capital: "Urumaco",
                parroquias: [
                    "Bruzual",
                    "Urumaco"
                ]
            },
            {
                municipio: "Zamora",
                capital: "Puerto Cumarebo",
                parroquias: [
                    "Puerto Cumarebo",
                    "La Ciénaga",
                    "La Soledad",
                    "Pueblo Cumarebo",
                    "Zazárida"
                ]
            }
        ],
        ciudades: [
            "Adícora",
            "Boca de Aroa",
            "Cabure",
            "Capadare",
            "Capatárida",
            "Chichiriviche",
            "Churuguara",
            "Coro",
            "Cumarebo",
            "Dabajuro",
            "Judibana",
            "La Cruz de Taratara",
            "La Vela de Coro",
            "Los Taques",
            "Maparari",
            "Mene de Mauroa",
            "Mirimire",
            "Pedregal",
            "Píritu Falcón",
            "Pueblo Nuevo Falcón",
            "Puerto Cumarebo",
            "Punta Cardón",
            "Punto Fijo",
            "San Juan de Los Cayos",
            "San Luis",
            "Santa Ana Falcón",
            "Santa Cruz De Bucaral",
            "Tocopero",
            "Tocuyo de La Costa",
            "Tucacas",
            "Yaracal"
        ]
    },
    {
        iso_31662: "VE-J",
        estado: "Guárico",
        capital: "San Juan de Los Morros",
        id_estado: 11,
        municipios: [
            {
                municipio: "Camaguán",
                capital: "Camaguán",
                parroquias: [
                    "Camaguán",
                    "Puerto Miranda",
                    "Uverito"
                ]
            },
            {
                municipio: "Chaguaramas",
                capital: "Chaguaramas",
                parroquias: [
                    "Chaguaramas"
                ]
            },
            {
                municipio: "El Socorro",
                capital: "El Socorro",
                parroquias: [
                    "El Socorro"
                ]
            },
            {
                municipio: "Infante",
                capital: "Valle de La Pascua",
                parroquias: [
                    "Valle de la Pascua",
                    "Espino"
                ]
            },
            {
                municipio: "Las Mercedes",
                capital: "Las Mercedes",
                parroquias: [
                    "Las Mercedes",
                    "Cabruta",
                    "Santa Rita de Manapire"
                ]
            },
            {
                municipio: "Mellado",
                capital: "El Sombrero",
                parroquias: [
                    "El Sombrero",
                    "Sosa"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Calabozo",
                parroquias: [
                    "El Calvario",
                    "El Rastro",
                    "Guardatinajas",
                    "Capital Urbana Calabozo"
                ]
            },
            {
                municipio: "Monagas",
                capital: "Altagracia de Orituco",
                parroquias: [
                    "Altagracia de Orituco",
                    "San Rafael de Orituco",
                    "San Francisco Javier de Lezama",
                    "Paso Real de Macaira",
                    "Carlos Soublette",
                    "San Francisco de Macaira",
                    "Libertad de Orituco"
                ]
            },
            {
                municipio: "Ortiz",
                capital: "Ortiz",
                parroquias: [
                    "San José de Tiznados",
                    "San Francisco de Tiznados",
                    "San Lorenzo de Tiznados",
                    "Ortiz"
                ]
            },
            {
                municipio: "Ribas",
                capital: "Tucupido",
                parroquias: [
                    "Tucupido",
                    "San Rafael de Laya"
                ]
            },
            {
                municipio: "Roscio",
                capital: "San Juan de Los Morros",
                parroquias: [
                    "Cantagallo",
                    "San Juan de los Morros",
                    "Parapara"
                ]
            },
            {
                municipio: "San Gerónimo de Guayabal",
                capital: "Guayabal",
                parroquias: [
                    "Guayabal",
                    "Cazorla"
                ]
            },
            {
                municipio: "San José de Guaribe",
                capital: "San José de Guaribe",
                parroquias: [
                    "San José de Guaribe",
                    "Uveral"
                ]
            },
            {
                municipio: "Santa María de Ipire",
                capital: "Santa María de Ipire",
                parroquias: [
                    "Santa María de Ipire",
                    "Altamira"
                ]
            },
            {
                municipio: "Zaraza",
                capital: "Zaraza",
                parroquias: [
                    "Unare",
                    "Zaraza"
                ]
            }
        ],
        ciudades: [
            "Altagracia de Orituco",
            "Cabruta",
            "Calabozo",
            "Camaguán",
            "Chaguaramas Guárico",
            "El Socorro",
            "El Sombrero",
            "Las Mercedes de Los Llanos",
            "Lezama",
            "Onoto",
            "Ortíz",
            "San José de Guaribe",
            "San Juan de Los Morros",
            "San Rafael de Laya",
            "Santa María de Ipire",
            "Tucupido",
            "Valle de La Pascua",
            "Zaraza"
        ]
    },
    {
        iso_31662: "VE-K",
        estado: "Lara",
        capital: "Barquisimeto",
        id_estado: 12,
        municipios: [
            {
                municipio: "Andrés Eloy Blanco",
                capital: "Sanare",
                parroquias: [
                    "Quebrada Honda de Guache",
                    "Pío Tamayo",
                    "Yacambú"
                ]
            },
            {
                municipio: "Crespo",
                capital: "Duaca",
                parroquias: [
                    "Freitez",
                    "José María Blanco"
                ]
            },
            {
                municipio: "Iribarren",
                capital: "Barquisimeto",
                parroquias: [
                    "Catedral",
                    "Concepción",
                    "El Cují",
                    "Juan de Villegas",
                    "Santa Rosa",
                    "Tamaca",
                    "Unión",
                    "Aguedo Felipe Alvarado",
                    "Buena Vista",
                    "Juárez"
                ]
            },
            {
                municipio: "Jiménez",
                capital: "Quibor",
                parroquias: [
                    "Juan Bautista Rodríguez",
                    "Cuara",
                    "Diego de Lozada",
                    "Paraíso de San José",
                    "San Miguel",
                    "Tintorero",
                    "José Bernardo Dorante",
                    "Coronel Mariano Peraza"
                ]
            },
            {
                municipio: "Morán",
                capital: "El Tocuyo",
                parroquias: [
                    "Anzoátegui",
                    "Bolívar",
                    "Guárico",
                    "Hilario Luna y Luna",
                    "Humocaro Bajo",
                    "Humocaro Alto",
                    "La Candelaria",
                    "Morán"
                ]
            },
            {
                municipio: "Palavecino",
                capital: "Cabudare",
                parroquias: [
                    "Cabudare",
                    "José Gregorio Bastidas",
                    "Agua Viva"
                ]
            },
            {
                municipio: "Simón Planas",
                capital: "Sarare",
                parroquias: [
                    "Buría",
                    "Gustavo Vega",
                    "Sarare"
                ]
            },
            {
                municipio: "Torres",
                capital: "Carora",
                parroquias: [
                    "Altagracia",
                    "Antonio Díaz",
                    "Camacaro",
                    "Castañeda",
                    "Cecilio Zubillaga",
                    "Chiquinquira",
                    "El Blanco",
                    "Espinoza de los Monteros",
                    "Heriberto Arrollo",
                    "Lara",
                    "Las Mercedes",
                    "Manuel Morillo",
                    "Montaña Verde",
                    "Montes de Oca",
                    "Reyes de Vargas",
                    "Torres",
                    "Trinidad Samuel"
                ]
            },
            {
                municipio: "Urdaneta",
                capital: "Siquisique",
                parroquias: [
                    "Siquisique",
                    "San Miguel",
                    "Moroturo",
                    "Xaguas"
                ]
            }
        ],
        ciudades: [
            "Aguada Grande",
            "Atarigua",
            "Barquisimeto",
            "Bobare",
            "Cabudare",
            "Carora",
            "Cubiro",
            "Cují",
            "Duaca",
            "El Manzano",
            "El Tocuyo",
            "Guaríco",
            "Humocaro Alto",
            "Humocaro Bajo",
            "La Miel",
            "Moroturo",
            "Quíbor",
            "Río Claro",
            "Sanare",
            "Santa Inés",
            "Sarare",
            "Siquisique",
            "Tintorero"
        ]
    },
    {
        iso_31662: "VE-L",
        estado: "Mérida",
        capital: "Mérida",
        id_estado: 13,
        municipios: [
            {
                municipio: "Alberto Adriani",
                capital: "El Vigía",
                parroquias: [
                    "Presidente Betancourt",
                    "Presidente Páez",
                    "Presidente Rómulo Gallegos",
                    "Gabriel Picón González",
                    "Héctor Amable Mora",
                    "José Nucete Sardi",
                    "Pulido Méndez"
                ]
            },
            {
                municipio: "Andrés Bello",
                capital: "La Azulita",
                parroquias: [
                    "La Azulita"
                ]
            },
            {
                municipio: "Antonio Pinto Salinas",
                capital: "Santa Cruz de Mora",
                parroquias: [
                    "Santa Cruz de Mora",
                    "Mesa Bolívar",
                    "Mesa de Las Palmas"
                ]
            },
            {
                municipio: "Aricagua",
                capital: "Aricagua",
                parroquias: [
                    "Aricagua",
                    "San Antonio"
                ]
            },
            {
                municipio: "Arzobispo Chacón",
                capital: "Canaguá",
                parroquias: [
                    "Canagua",
                    "Capurí",
                    "Chacantá",
                    "El Molino",
                    "Guaimaral",
                    "Mucutuy",
                    "Mucuchachí"
                ]
            },
            {
                municipio: "Campo Elías",
                capital: "Ejido",
                parroquias: [
                    "Fernández Peña",
                    "Matriz",
                    "Montalbán",
                    "Acequias",
                    "Jají",
                    "La Mesa",
                    "San José del Sur"
                ]
            },
            {
                municipio: "Caracciolo Parra Olmedo",
                capital: "Tucaní",
                parroquias: [
                    "Tucaní",
                    "Florencio Ramírez"
                ]
            },
            {
                municipio: "Cardenal Quintero",
                capital: "Santo Domingo",
                parroquias: [
                    "Santo Domingo",
                    "Las Piedras"
                ]
            },
            {
                municipio: "Guaraque",
                capital: "Guaraque",
                parroquias: [
                    "Guaraque",
                    "Mesa de Quintero",
                    "Río Negro"
                ]
            },
            {
                municipio: "Julio César Salas",
                capital: "Arapuey",
                parroquias: [
                    "Arapuey",
                    "Palmira"
                ]
            },
            {
                municipio: "Justo Briceño",
                capital: "Torondoy",
                parroquias: [
                    "San Cristóbal de Torondoy",
                    "Torondoy"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Mérida",
                parroquias: [
                    "Antonio Spinetti Dini",
                    "Arias",
                    "Caracciolo Parra Pérez",
                    "Domingo Peña",
                    "El Llano",
                    "Gonzalo Picón Febres",
                    "Jacinto Plaza",
                    "Juan Rodríguez Suárez",
                    "Lasso de la Vega",
                    "Mariano Picón Salas",
                    "Milla",
                    "Osuna Rodríguez",
                    "Sagrario",
                    "El Morro",
                    "Los Nevados"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Timotes",
                parroquias: [
                    "Andrés Eloy Blanco",
                    "La Venta",
                    "Piñango",
                    "Timotes"
                ]
            },
            {
                municipio: "Obispo Ramos de Lora",
                capital: "Santa Elena de Arenales",
                parroquias: [
                    "Eloy Paredes",
                    "San Rafael de Alcázar",
                    "Santa Elena de Arenales"
                ]
            },
            {
                municipio: "Padre Noguera",
                capital: "Santa María de Caparo",
                parroquias: [
                    "Santa María de Caparo"
                ]
            },
            {
                municipio: "Pueblo Llano",
                capital: "Pueblo Llano",
                parroquias: [
                    "Pueblo Llano"
                ]
            },
            {
                municipio: "Rangel",
                capital: "Mucuchíes",
                parroquias: [
                    "Cacute",
                    "La Toma",
                    "Mucuchíes",
                    "Mucurubá",
                    "San Rafael"
                ]
            },
            {
                municipio: "Rivas Dávila",
                capital: "Bailadores",
                parroquias: [
                    "Gerónimo Maldonado",
                    "Bailadores"
                ]
            },
            {
                municipio: "Santos Marquina",
                capital: "Tabay",
                parroquias: [
                    "Tabay"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Lagunillas",
                parroquias: [
                    "Chiguará",
                    "Estánquez",
                    "Lagunillas",
                    "La Trampa",
                    "Pueblo Nuevo del Sur",
                    "San Juan"
                ]
            },
            {
                municipio: "Tovar",
                capital: "Tovar",
                parroquias: [
                    "El Amparo",
                    "El Llano",
                    "San Francisco",
                    "Tovar"
                ]
            },
            {
                municipio: "Tulio Febres Cordero",
                capital: "Nueva Bolivia",
                parroquias: [
                    "Independencia",
                    "María de la Concepción Palacios Blanco",
                    "Nueva Bolivia",
                    "Santa Apolonia"
                ]
            },
            {
                municipio: "Zea",
                capital: "Zea",
                parroquias: [
                    "Caño El Tigre",
                    "Zea"
                ]
            }
        ],
        ciudades: [
            "Apartaderos Mérida",
            "Arapuey",
            "Bailadores",
            "Caja Seca",
            "Canaguá",
            "Chachopo",
            "Chiguara",
            "Ejido",
            "El Vigía",
            "La Azulita",
            "La Playa",
            "Lagunillas Mérida",
            "Mérida",
            "Mesa de Bolívar",
            "Mucuchíes",
            "Mucujepe",
            "Mucuruba",
            "Nueva Bolivia",
            "Palmarito",
            "Pueblo Llano",
            "Santa Cruz de Mora",
            "Santa Elena de Arenales",
            "Santo Domingo",
            "Tabáy",
            "Timotes",
            "Torondoy",
            "Tovar",
            "Tucani",
            "Zea"
        ]
    },
    {
        iso_31662: "VE-M",
        estado: "Miranda",
        capital: "Los Teques",
        id_estado: 14,
        municipios: [
            {
                municipio: "Acevedo",
                capital: "Caucagua",
                parroquias: [
                    "Aragüita",
                    "Arévalo González",
                    "Capaya",
                    "Caucagua",
                    "Panaquire",
                    "Ribas",
                    "El Café",
                    "Marizapa"
                ]
            },
            {
                municipio: "Andrés Bello",
                capital: "San José de Barlovento",
                parroquias: [
                    "Cumbo",
                    "San José de Barlovento"
                ]
            },
            {
                municipio: "Baruta",
                capital: "Baruta",
                parroquias: [
                    "El Cafetal",
                    "Las Minas",
                    "Nuestra Señora del Rosario"
                ]
            },
            {
                municipio: "Brión",
                capital: "Higuerote",
                parroquias: [
                    "Higuerote",
                    "Curiepe",
                    "Tacarigua de Brión"
                ]
            },
            {
                municipio: "Buroz",
                capital: "Mamporal",
                parroquias: [
                    "Mamporal"
                ]
            },
            {
                municipio: "Carrizal",
                capital: "Carrizal",
                parroquias: [
                    "Carrizal"
                ]
            },
            {
                municipio: "Chacao",
                capital: "Chacao",
                parroquias: [
                    "Chacao"
                ]
            },
            {
                municipio: "Cristóbal Rojas",
                capital: "Charallave",
                parroquias: [
                    "Charallave",
                    "Las Brisas"
                ]
            },
            {
                municipio: "El Hatillo",
                capital: "Santa Rosalía de Palermo",
                parroquias: [
                    "El Hatillo"
                ]
            },
            {
                municipio: "Guaicaipuro",
                capital: "Los Teques",
                parroquias: [
                    "Altagracia de la Montaña",
                    "Cecilio Acosta",
                    "Los Teques",
                    "El Jarillo",
                    "San Pedro.",
                    "Tácata",
                    "Paracotos"
                ]
            },
            {
                municipio: "Independencia",
                capital: "Santa Teresa del Tuy",
                parroquias: [
                    "Cartanal",
                    "Santa Teresa del Tuy"
                ]
            },
            {
                municipio: "Lander",
                capital: "Ocumare del Tuy",
                parroquias: [
                    "La Democracia",
                    "Ocumare del Tuy",
                    "Santa Bárbara"
                ]
            },
            {
                municipio: "Los Salias",
                capital: "San Antonio de los Altos",
                parroquias: [
                    "San Antonio de los Altos"
                ]
            },
            {
                municipio: "Páez",
                capital: "Río Chico",
                parroquias: [
                    "Río Chico",
                    "El Guapo",
                    "Tacarigua de la Laguna",
                    "Paparo",
                    "San Fernando del Guapo"
                ]
            },
            {
                municipio: "Paz Castillo",
                capital: "Santa Lucía",
                parroquias: [
                    "Santa Lucía del Tuy"
                ]
            },
            {
                municipio: "Pedro Gual",
                capital: "Cúpira",
                parroquias: [
                    "Cúpira",
                    "Machurucuto"
                ]
            },
            {
                municipio: "Plaza",
                capital: "Guarenas",
                parroquias: [
                    "Guarenas"
                ]
            },
            {
                municipio: "Simón Bolívar",
                capital: "San Francisco de Yare",
                parroquias: [
                    "San Antonio de Yare",
                    "San Francisco de Yare"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Petare",
                parroquias: [
                    "Leoncio Martínez",
                    "Petare",
                    "Caucagüita",
                    "Filas de Mariche",
                    "La Dolorita"
                ]
            },
            {
                municipio: "Urdaneta",
                capital: "Cúa",
                parroquias: [
                    "Cúa",
                    "Nueva Cúa"
                ]
            },
            {
                municipio: "Zamora",
                capital: "Guatire",
                parroquias: [
                    "Guatire",
                    "Bolívar"
                ]
            }
        ],
        ciudades: [
            "Araguita",
            "Carrizal",
            "Caucagua",
            "Chaguaramas Miranda",
            "Charallave",
            "Chirimena",
            "Chuspa",
            "Cúa",
            "Cupira",
            "Curiepe",
            "El Guapo",
            "El Jarillo",
            "Filas de Mariche",
            "Guarenas",
            "Guatire",
            "Higuerote",
            "Los Anaucos",
            "Los Teques",
            "Ocumare del Tuy",
            "Panaquire",
            "Paracotos",
            "Río Chico",
            "San Antonio de Los Altos",
            "San Diego de Los Altos",
            "San Fernando del Guapo",
            "San Francisco de Yare",
            "San José de Los Altos",
            "San José de Río Chico",
            "San Pedro de Los Altos",
            "Santa Lucía",
            "Santa Teresa",
            "Tacarigua de La Laguna",
            "Tacarigua de Mamporal",
            "Tácata",
            "Turumo"
        ]
    },
    {
        iso_31662: "VE-N",
        estado: "Monagas",
        capital: "Maturín",
        id_estado: 15,
        municipios: [
            {
                municipio: "Acosta",
                capital: "San Antonio de Capayacuar",
                parroquias: [
                    "San Antonio de Maturín",
                    "San Francisco de Maturín"
                ]
            },
            {
                municipio: "Aguasay",
                capital: "Aguasay",
                parroquias: [
                    "Aguasay"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Caripito",
                parroquias: [
                    "Caripito"
                ]
            },
            {
                municipio: "Caripe",
                capital: "Caripe",
                parroquias: [
                    "El Guácharo",
                    "La Guanota",
                    "Sabana de Piedra",
                    "San Agustín",
                    "Teresen",
                    "Caripe"
                ]
            },
            {
                municipio: "Cedeño",
                capital: "Caicara de Maturín",
                parroquias: [
                    "Areo",
                    "Capital Cedeño",
                    "San Félix de Cantalicio",
                    "Viento Fresco"
                ]
            },
            {
                municipio: "Ezequiel Zamora",
                capital: "Punta de Mata",
                parroquias: [
                    "El Tejero",
                    "Punta de Mata"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Temblador",
                parroquias: [
                    "Chaguaramas",
                    "Las Alhuacas",
                    "Tabasca",
                    "Temblador"
                ]
            },
            {
                municipio: "Maturín",
                capital: "Maturín",
                parroquias: [
                    "Alto de los Godos",
                    "Boquerón",
                    "Las Cocuizas",
                    "La Cruz",
                    "San Simón",
                    "El Corozo",
                    "El Furrial",
                    "Jusepín",
                    "La Pica",
                    "San Vicente"
                ]
            },
            {
                municipio: "Piar",
                capital: "Aragua de Maturín",
                parroquias: [
                    "Aparicio",
                    "Aragua de Maturín",
                    "Chaguamal",
                    "El Pinto",
                    "Guanaguana",
                    "La Toscana",
                    "Taguaya"
                ]
            },
            {
                municipio: "Punceres",
                capital: "Quiriquire",
                parroquias: [
                    "Cachipo",
                    "Quiriquire"
                ]
            },
            {
                municipio: "Santa Bárbara",
                capital: "Santa Bárbara",
                parroquias: [
                    "Santa Bárbara"
                ]
            },
            {
                municipio: "Sotillo",
                capital: "Barrancas del Orinoco",
                parroquias: [
                    "Barrancas",
                    "Los Barrancos de Fajardo"
                ]
            },
            {
                municipio: "Uracoa",
                capital: "Uracoa",
                parroquias: [
                    "Uracoa"
                ]
            }
        ],
        ciudades: [
            "Aguasay",
            "Aragua de Maturín",
            "Barrancas del Orinoco",
            "Caicara de Maturín",
            "Caripe",
            "Caripito",
            "Chaguaramal",
            "Chaguaramas Monagas",
            "El Furrial",
            "El Tejero",
            "Jusepín",
            "La Toscana",
            "Maturín",
            "Miraflores",
            "Punta de Mata",
            "Quiriquire",
            "San Antonio de Maturín",
            "San Vicente Monagas",
            "Santa Bárbara",
            "Temblador",
            "Teresen",
            "Uracoa"
        ]
    },
    {
        iso_31662: "VE-O",
        estado: "Nueva Esparta",
        capital: "La Asunción",
        id_estado: 16,
        municipios: [
            {
                municipio: "Antolín del Campo",
                capital: "Paraguachí",
                parroquias: [
                    "Antolín del Campo"
                ]
            },
            {
                municipio: "Arismendi",
                capital: "La Asunción",
                parroquias: [
                    "Arismendi"
                ]
            },
            {
                municipio: "Díaz",
                capital: "San Juan Bautista",
                parroquias: [
                    "San Juan Bautista",
                    "Zabala"
                ]
            },
            {
                municipio: "García",
                capital: "El Valle",
                parroquias: [
                    "García",
                    "Francisco Fajardo"
                ]
            },
            {
                municipio: "Gómez",
                capital: "Santa Ana",
                parroquias: [
                    "Bolívar",
                    "Guevara",
                    "Cerro de Matasiete",
                    "Santa Ana",
                    "Sucre"
                ]
            },
            {
                municipio: "Maneiro",
                capital: "Pampatar",
                parroquias: [
                    "Aguirre",
                    "Maneiro"
                ]
            },
            {
                municipio: "Marcano",
                capital: "Juan Griego",
                parroquias: [
                    "Adrián",
                    "Juan Griego",
                    "Yaguaraparo"
                ]
            },
            {
                municipio: "Mariño",
                capital: "Porlamar",
                parroquias: [
                    "Porlamar"
                ]
            },
            {
                municipio: "Península de Macanao",
                capital: "Boca de Río",
                parroquias: [
                    "San Francisco de Macanao",
                    "Boca de Río"
                ]
            },
            {
                municipio: "Tubores",
                capital: "Punta de Piedras",
                parroquias: [
                    "Tubores",
                    "Los Barales"
                ]
            },
            {
                municipio: "Villalba",
                capital: "San Pedro de Coche",
                parroquias: [
                    "Vicente Fuentes",
                    "Villalba"
                ]
            }
        ],
        ciudades: [
            "Altagracia",
            "Boca de Pozo",
            "Boca de Río",
            "El Espinal",
            "El Valle del Espíritu Santo",
            "El Yaque",
            "Juangriego",
            "La Asunción",
            "La Guardia",
            "Pampatar",
            "Porlamar",
            "Puerto Fermín",
            "Punta de Piedras",
            "San Francisco de Macanao",
            "San Juan Bautista",
            "San Pedro de Coche",
            "Santa Ana de Nueva Esparta",
            "Villa Rosa"
        ]
    },
    {
        iso_31662: "VE-P",
        estado: "Portuguesa",
        capital: "Guanare",
        id_estado: 17,
        municipios: [
            {
                municipio: "Agua Blanca",
                capital: "Agua Blanca",
                parroquias: [
                    "Agua Blanca"
                ]
            },
            {
                municipio: "Araure",
                capital: "Araure",
                parroquias: [
                    "Araure",
                    "Río Acarigua"
                ]
            },
            {
                municipio: "Esteller",
                capital: "Píritu",
                parroquias: [
                    "Píritu",
                    "Uveral"
                ]
            },
            {
                municipio: "Guanare",
                capital: "Guanare",
                parroquias: [
                    "Cordova",
                    "Guanare",
                    "San José de la Montaña",
                    "San Juan de Guanaguanare",
                    "Virgen de Coromoto"
                ]
            },
            {
                municipio: "Guanarito",
                capital: "Guanarito",
                parroquias: [
                    "Guanarito",
                    "Trinidad de la Capilla",
                    "Divina Pastora"
                ]
            },
            {
                municipio: "Monseñor José Vicente de Unda",
                capital: "Paraíso de Chabasquén",
                parroquias: [
                    "Peña Blanca"
                ]
            },
            {
                municipio: "Ospino",
                capital: "Ospino",
                parroquias: [
                    "Aparición",
                    "La Estación",
                    "Ospino"
                ]
            },
            {
                municipio: "Páez",
                capital: "Acarigua",
                parroquias: [
                    "Acarigua",
                    "Payara",
                    "Pimpinela",
                    "Ramón Peraza"
                ]
            },
            {
                municipio: "Papelón",
                capital: "Papelón",
                parroquias: [
                    "Caño Delgadito",
                    "Papelón"
                ]
            },
            {
                municipio: "San Genaro de Boconoíto",
                capital: "Boconoíto",
                parroquias: [
                    "Antolín Tovar Anquino",
                    "Boconoíto"
                ]
            },
            {
                municipio: "San Rafael de Onoto",
                capital: "San Rafael de Onoto",
                parroquias: [
                    "Santa Fé",
                    "San Rafael de Onoto",
                    "Thermo Morales"
                ]
            },
            {
                municipio: "Santa Rosalía",
                capital: "El Playón",
                parroquias: [
                    "Florida",
                    "El Playón"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Biscucuy",
                parroquias: [
                    "Biscucuy",
                    "Concepción",
                    "San José de Saguaz",
                    "San Rafael de Palo Alzado",
                    "Uvencio Antonio Velásquez",
                    "Villa Rosa"
                ]
            },
            {
                municipio: "Turén",
                capital: "Villa Bruzual",
                parroquias: [
                    "Canelones",
                    "Santa Cruz",
                    "San Isidro Labrador"
                ]
            }
        ],
        ciudades: [
            "Acarigua",
            "Agua Blanca",
            "Araure",
            "Biscucuy",
            "Boconoito",
            "Campo Elías",
            "Chabasquén",
            "Guanare",
            "Guanarito",
            "La Aparición",
            "La Misión",
            "Mesa de Cavacas",
            "Ospino",
            "Papelón",
            "Payara",
            "Pimpinela",
            "Píritu de Portuguesa",
            "San Rafael de Onoto",
            "Santa Rosalía",
            "Turén"
        ]
    },
    {
        iso_31662: "VE-R",
        estado: "Sucre",
        capital: "Cumaná",
        id_estado: 18,
        municipios: [
            {
                municipio: "Andrés Eloy Blanco",
                capital: "Casanay",
                parroquias: [
                    "Mariño",
                    "Rómulo Gallegos"
                ]
            },
            {
                municipio: "Andrés Mata",
                capital: "San José de Aerocuar",
                parroquias: [
                    "San José de Aerocuar",
                    "Tavera Acosta"
                ]
            },
            {
                municipio: "Arismendi",
                capital: "Río Caribe",
                parroquias: [
                    "Río Caribe",
                    "Antonio José de Sucre",
                    "El Morro de Puerto Santo",
                    "Puerto Santo",
                    "San Juan de las Galdonas"
                ]
            },
            {
                municipio: "Benítez",
                capital: "El Pilar",
                parroquias: [
                    "El Pilar",
                    "El Rincón",
                    "General Francisco Antonio Váquez",
                    "Guaraúnos",
                    "Tunapuicito",
                    "Unión"
                ]
            },
            {
                municipio: "Bermúdez",
                capital: "Carúpano",
                parroquias: [
                    "Santa Catalina",
                    "Santa Rosa",
                    "Santa Teresa",
                    "Bolívar",
                    "Maracapana"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Marigüitar",
                parroquias: []
            },
            {
                municipio: "Cajigal",
                capital: "Yaguaraparo",
                parroquias: [
                    "Libertad",
                    "El Paujil",
                    "Yaguaraparo"
                ]
            },
            {
                municipio: "Cruz Salmerón Acosta",
                capital: "Araya",
                parroquias: [
                    "Cruz Salmerón Acosta",
                    "Chacopata",
                    "Manicuare"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Tunapuy",
                parroquias: [
                    "Tunapuy",
                    "Campo Elías"
                ]
            },
            {
                municipio: "Mariño",
                capital: "Irapa",
                parroquias: [
                    "Irapa",
                    "Campo Claro",
                    "Maraval",
                    "San Antonio de Irapa",
                    "Soro"
                ]
            },
            {
                municipio: "Mejía",
                capital: "San Antonio del Golfo",
                parroquias: [
                    "Mejía"
                ]
            },
            {
                municipio: "Montes",
                capital: "Cumanacoa",
                parroquias: [
                    "Cumanacoa",
                    "Arenas",
                    "Aricagua",
                    "Cocollar",
                    "San Fernando",
                    "San Lorenzo"
                ]
            },
            {
                municipio: "Ribero",
                capital: "Cariaco",
                parroquias: [
                    "Villa Frontado (Muelle de Cariaco)",
                    "Catuaro",
                    "Rendón",
                    "San Cruz",
                    "Santa María"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Cumaná",
                parroquias: [
                    "Altagracia Cumaná",
                    "Santa Inés Cumaná",
                    "Valentín Valiente Cumaná",
                    "Ayacucho Cumaná",
                    "San Juan",
                    "Raúl Leoni",
                    "Gran Mariscal"
                ]
            },
            {
                municipio: "Valdez",
                capital: "Güiria",
                parroquias: [
                    "Cristóbal Colón",
                    "Bideau",
                    "Punta de Piedras",
                    "Güiria"
                ]
            }
        ],
        ciudades: [
            "Altos de Sucre",
            "Araya",
            "Cariaco",
            "Carúpano",
            "Casanay",
            "Cumaná",
            "Cumanacoa",
            "El Morro Puerto Santo",
            "El Pilar",
            "El Poblado",
            "Guaca",
            "Guiria",
            "Irapa",
            "Manicuare",
            "Mariguitar",
            "Río Caribe",
            "San Antonio del Golfo",
            "San José de Aerocuar",
            "San Vicente de Sucre",
            "Santa Fe de Sucre",
            "Tunapuy",
            "Yaguaraparo",
            "Yoco"
        ]
    },
    {
        iso_31662: "VE-S",
        estado: "Táchira",
        capital: "San Cristóbal",
        id_estado: 19,
        municipios: [
            {
                municipio: "Andrés Bello",
                capital: "Cordero",
                parroquias: [
                    "Andrés Bello"
                ]
            },
            {
                municipio: "Antonio Rómulo Costa",
                capital: "Las Mesas",
                parroquias: [
                    "Antonio Rómulo Costa"
                ]
            },
            {
                municipio: "Ayacucho",
                capital: "Colón",
                parroquias: [
                    "Ayacucho",
                    "Rivas Berti",
                    "San Pedro del Río"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "San Antonio del Táchira",
                parroquias: [
                    "Bolívar",
                    "Palotal",
                    "General Juan Vicente Gómez",
                    "Isaías Medina Angarita"
                ]
            },
            {
                municipio: "Cárdenas",
                capital: "Táriba",
                parroquias: [
                    "Cárdenas",
                    "Amenodoro Rangel Lamus",
                    "La Florida"
                ]
            },
            {
                municipio: "Córdoba",
                capital: "Santa Ana de Táchira",
                parroquias: [
                    "Córdoba"
                ]
            },
            {
                municipio: "Fernández Feo",
                capital: "San Rafael del Piñal",
                parroquias: [
                    "Fernández Feo",
                    "Alberto Adriani",
                    "Santo Domingo"
                ]
            },
            {
                municipio: "Francisco de Miranda",
                capital: "San José de Bolívar",
                parroquias: [
                    "Francisco de Miranda"
                ]
            },
            {
                municipio: "García de Hevia",
                capital: "La Fría",
                parroquias: [
                    "García de Hevia",
                    "Boca de Grita",
                    "José Antonio Páez"
                ]
            },
            {
                municipio: "Guásimos",
                capital: "Palmira",
                parroquias: [
                    "Guásimos"
                ]
            },
            {
                municipio: "Independencia",
                capital: "Capacho Nuevo",
                parroquias: [
                    "Independencia",
                    "Juan Germán Roscio",
                    "Román Cárdenas"
                ]
            },
            {
                municipio: "Jáuregui",
                capital: "La Grita",
                parroquias: [
                    "Jáuregui",
                    "Emilio Constantino Guerrero",
                    "Monseñor Miguel Antonio Salas"
                ]
            },
            {
                municipio: "José María Vargas",
                capital: "El Cobre",
                parroquias: [
                    "José María Vargas"
                ]
            },
            {
                municipio: "Junín",
                capital: "Rubio",
                parroquias: [
                    "Junín",
                    "La Petrólea",
                    "Quinimarí",
                    "Bramón"
                ]
            },
            {
                municipio: "Libertad",
                capital: "Capacho Viejo",
                parroquias: [
                    "Libertad",
                    "Cipriano Castro",
                    "Manuel Felipe Rugeles"
                ]
            },
            {
                municipio: "Libertador",
                capital: "Abejales",
                parroquias: [
                    "Capital Libertador",
                    "Doradas",
                    "Emeterio Ochoa",
                    "San Joaquín de Navay"
                ]
            },
            {
                municipio: "Lobatera",
                capital: "Lobatera",
                parroquias: [
                    "Lobatera",
                    "Constitución"
                ]
            },
            {
                municipio: "Michelena",
                capital: "Michelena",
                parroquias: [
                    "Michelena"
                ]
            },
            {
                municipio: "Panamericano",
                capital: "Coloncito",
                parroquias: [
                    "Panamericano",
                    "La Palmita"
                ]
            },
            {
                municipio: "Pedro María Ureña",
                capital: "Ureña",
                parroquias: [
                    "Pedro María Ureña",
                    "Nueva Arcadia"
                ]
            },
            {
                municipio: "Rafael Urdaneta",
                capital: "Delicias",
                parroquias: [
                    "Delicias",
                    "Pecaya"
                ]
            },
            {
                municipio: "Samuel Darío Maldonado",
                capital: "La Tendida",
                parroquias: [
                    "Samuel Darío Maldonado",
                    "Boconó",
                    "Hernández"
                ]
            },
            {
                municipio: "San Cristóbal",
                capital: "San Cristóbal",
                parroquias: [
                    "La Concordia",
                    "San Juan Bautista",
                    "Pedro María Morantes",
                    "San Sebastián",
                    "Dr. Francisco Romero Lobo"
                ]
            },
            {
                municipio: "Seboruco",
                capital: "Seboruco",
                parroquias: [
                    "Seboruco"
                ]
            },
            {
                municipio: "Simón Rodríguez",
                capital: "San Simón",
                parroquias: [
                    "Simón Rodríguez"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Queniquea",
                parroquias: [
                    "Sucre",
                    "Eleazar López Contreras",
                    "San Pablo"
                ]
            },
            {
                municipio: "Torbes",
                capital: "San Josecito",
                parroquias: [
                    "San José Obrero",
                    "San Juan Eudes"
                ]
            },
            {
                municipio: "Uribante",
                capital: "Pregonero",
                parroquias: [
                    "Uribante",
                    "Cárdenas",
                    "Juan Pablo Peñalosa",
                    "Potosí"
                ]
            },
            {
                municipio: "San Judas Tadeo",
                capital: "Umuquena",
                parroquias: [
                    "San Judas Tadeo"
                ]
            }
        ],
        ciudades: [
            "Abejales",
            "Borota",
            "Bramon",
            "Capacho",
            "Colón",
            "Coloncito",
            "Cordero",
            "El Cobre",
            "El Pinal",
            "Independencia",
            "La Fría",
            "La Grita",
            "La Pedrera",
            "La Tendida",
            "Las Delicias",
            "Las Hernández",
            "Lobatera",
            "Michelena",
            "Palmira",
            "Pregonero",
            "Queniquea",
            "Rubio",
            "San Antonio del Tachira",
            "San Cristobal",
            "San José de Bolívar",
            "San Josecito",
            "San Pedro del Río",
            "Santa Ana Táchira",
            "Seboruco",
            "Táriba",
            "Umuquena"
        ]
    },
    {
        iso_31662: "VE-T",
        estado: "Trujillo",
        capital: "Trujillo",
        id_estado: 20,
        municipios: [
            {
                municipio: "Andrés Bello",
                capital: "Santa Isabel",
                parroquias: [
                    "Araguaney",
                    "El Jaguito",
                    "La Esperanza",
                    "Santa Isabel"
                ]
            },
            {
                municipio: "Boconó",
                capital: "Boconó",
                parroquias: [
                    "Boconó",
                    "El Carmen",
                    "Mosquey",
                    "Ayacucho",
                    "Burbusay",
                    "General Ribas",
                    "Guaramacal",
                    "Vega de Guaramacal",
                    "Monseñor Jáuregui",
                    "Rafael Rangel",
                    "San Miguel",
                    "San José"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Sabana Grande",
                parroquias: [
                    "Sabana Grande",
                    "Cheregüé",
                    "Granados"
                ]
            },
            {
                municipio: "Candelaria",
                capital: "Chejendé",
                parroquias: [
                    "Arnoldo Gabaldón",
                    "Bolivia",
                    "Carrillo",
                    "Cegarra",
                    "Chejendé",
                    "Manuel Salvador Ulloa",
                    "San José"
                ]
            },
            {
                municipio: "Carache",
                capital: "Carache",
                parroquias: [
                    "Carache",
                    "La Concepción",
                    "Cuicas",
                    "Panamericana",
                    "Santa Cruz"
                ]
            },
            {
                municipio: "Escuque",
                capital: "Escuque",
                parroquias: [
                    "Escuque",
                    "La Unión (El Alto Escuque)",
                    "Santa Rita",
                    "Sabana Libre"
                ]
            },
            {
                municipio: "José Felipe Márquez Cañizalez",
                capital: "El Paradero",
                parroquias: [
                    "El Socorro",
                    "Los Caprichos",
                    "Antonio José de Sucre"
                ]
            },
            {
                municipio: "Juan Vicente Campos Elías",
                capital: "Campo Elías",
                parroquias: [
                    "Campo Elías",
                    "Arnoldo Gabaldón"
                ]
            },
            {
                municipio: "La Ceiba",
                capital: "Santa Apolonia",
                parroquias: [
                    "Santa Apolonia",
                    "El Progreso",
                    "La Ceiba",
                    "Tres de Febrero"
                ]
            },
            {
                municipio: "Miranda",
                capital: "El Dividive",
                parroquias: [
                    "El Dividive",
                    "Agua Santa",
                    "Agua Caliente",
                    "El Cenizo",
                    "Valerita"
                ]
            },
            {
                municipio: "Monte Carmelo",
                capital: "Monte Carmelo",
                parroquias: [
                    "Monte Carmelo",
                    "Buena Vista",
                    "Santa María del Horcón"
                ]
            },
            {
                municipio: "Motatán",
                capital: "Motatán",
                parroquias: [
                    "Motatán",
                    "El Baño",
                    "Jalisco"
                ]
            },
            {
                municipio: "Pampán",
                capital: "Pampán",
                parroquias: [
                    "Pampán",
                    "Flor de Patria",
                    "La Paz",
                    "Santa Ana"
                ]
            },
            {
                municipio: "Pampanito",
                capital: "Pampanito",
                parroquias: [
                    "Pampanito",
                    "La Concepción",
                    "Pampanito II"
                ]
            },
            {
                municipio: "Rafael Rangel",
                capital: "Betijoque",
                parroquias: [
                    "Betijoque",
                    "José Gregorio Hernández",
                    "La Pueblita",
                    "Los Cedros"
                ]
            },
            {
                municipio: "San Rafael de Carvajal",
                capital: "Carvajal",
                parroquias: [
                    "Carvajal",
                    "Campo Alegre",
                    "Antonio Nicolás Briceño",
                    "José Leonardo Suárez"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Sabana de Mendoza",
                parroquias: [
                    "Sabana de Mendoza",
                    "Junín",
                    "Valmore Rodríguez",
                    "El Paraíso"
                ]
            },
            {
                municipio: "Trujillo",
                capital: "Trujillo",
                parroquias: [
                    "Andrés Linares",
                    "Chiquinquirá",
                    "Cristóbal Mendoza",
                    "Cruz Carrillo",
                    "Matriz",
                    "Monseñor Carrillo",
                    "Tres Esquinas"
                ]
            },
            {
                municipio: "Urdaneta",
                capital: "La Quebrada",
                parroquias: [
                    "Cabimbú",
                    "Jajó",
                    "La Mesa de Esnujaque",
                    "Santiago",
                    "Tuñame",
                    "La Quebrada"
                ]
            },
            {
                municipio: "Valera",
                capital: "Valera",
                parroquias: [
                    "Juan Ignacio Montilla",
                    "La Beatriz",
                    "La Puerta",
                    "Mendoza del Valle de Momboy",
                    "Mercedes Díaz",
                    "San Luis"
                ]
            }
        ],
        ciudades: [
            "Batatal",
            "Betijoque",
            "Boconó",
            "Carache",
            "Chejende",
            "Cuicas",
            "El Dividive",
            "El Jaguito",
            "Escuque",
            "Isnotú",
            "Jajó",
            "La Ceiba",
            "La Concepción de Trujllo",
            "La Mesa de Esnujaque",
            "La Puerta",
            "La Quebrada",
            "Mendoza Fría",
            "Meseta de Chimpire",
            "Monay",
            "Motatán",
            "Pampán",
            "Pampanito",
            "Sabana de Mendoza",
            "San Lázaro",
            "Santa Ana de Trujillo",
            "Tostós",
            "Trujillo",
            "Valera"
        ]
    },
    {
        iso_31662: "VE-W",
        estado: "Vargas",
        capital: "La Guaira",
        id_estado: 21,
        municipios: [
            {
                municipio: "Vargas",
                capital: "Vargas",
                parroquias: [
                    "Caraballeda",
                    "Carayaca",
                    "Carlos Soublette",
                    "Caruao Chuspa",
                    "Catia La Mar",
                    "El Junko",
                    "La Guaira",
                    "Macuto",
                    "Maiquetía",
                    "Naiguatá",
                    "Urimare"
                ]
            }
        ],
        ciudades: [
            "Carayaca",
            "Litoral"
        ]
    },
    {
        iso_31662: "VE-U",
        estado: "Yaracuy",
        capital: "San Felipe",
        id_estado: 22,
        municipios: [
            {
                municipio: "Arístides Bastidas",
                capital: "San Pablo",
                parroquias: [
                    "Arístides Bastidas"
                ]
            },
            {
                municipio: "Bolívar",
                capital: "Aroa",
                parroquias: [
                    "Bolívar"
                ]
            },
            {
                municipio: "Bruzual",
                capital: "Chivacoa",
                parroquias: [
                    "Chivacoa",
                    "Campo Elías"
                ]
            },
            {
                municipio: "Cocorote",
                capital: "Cocorote",
                parroquias: [
                    "Cocorote"
                ]
            },
            {
                municipio: "Independencia",
                capital: "Independencia",
                parroquias: [
                    "Independencia"
                ]
            },
            {
                municipio: "José Antonio Páez",
                capital: "Sabana de Parra",
                parroquias: [
                    "José Antonio Páez"
                ]
            },
            {
                municipio: "La Trinidad",
                capital: "Boraure",
                parroquias: [
                    "La Trinidad"
                ]
            },
            {
                municipio: "Manuel Monge",
                capital: "Yumare",
                parroquias: [
                    "Manuel Monge"
                ]
            },
            {
                municipio: "Nirgua",
                capital: "Nirgua",
                parroquias: [
                    "Salóm",
                    "Temerla",
                    "Nirgua"
                ]
            },
            {
                municipio: "Peña",
                capital: "Yaritagua",
                parroquias: [
                    "San Andrés",
                    "Yaritagua"
                ]
            },
            {
                municipio: "San Felipe",
                capital: "San Felipe",
                parroquias: [
                    "San Javier",
                    "Albarico",
                    "San Felipe"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Guama",
                parroquias: [
                    "Sucre"
                ]
            },
            {
                municipio: "Urachiche",
                capital: "Urachiche",
                parroquias: [
                    "Urachiche"
                ]
            },
            {
                municipio: "Veroes",
                capital: "Farriar",
                parroquias: [
                    "El Guayabo",
                    "Farriar"
                ]
            }
        ],
        ciudades: [
            "Aroa",
            "Boraure",
            "Campo Elías de Yaracuy",
            "Chivacoa",
            "Cocorote",
            "Farriar",
            "Guama",
            "Marín",
            "Nirgua",
            "Sabana de Parra",
            "Salom",
            "San Felipe",
            "San Pablo de Yaracuy",
            "Urachiche",
            "Yaritagua",
            "Yumare"
        ]
    },
    {
        iso_31662: "VE-V",
        estado: "Zulia",
        capital: "Maracaibo",
        id_estado: 23,
        municipios: [
            {
                municipio: "Almirante Padilla",
                capital: "El Toro",
                parroquias: [
                    "Isla de Toas",
                    "Monagas"
                ]
            },
            {
                municipio: "Baralt",
                capital: "San Timoteo",
                parroquias: [
                    "General Urdaneta",
                    "Libertador",
                    "Marcelino Briceño",
                    "Pueblo Nuevo",
                    "Manuel Guanipa Matos"
                ]
            },
            {
                municipio: "Cabimas",
                capital: "Cabimas",
                parroquias: [
                    "Ambrosio",
                    "Carmen Herrera",
                    "La Rosa",
                    "Germán Ríos Linares",
                    "San Benito",
                    "Rómulo Betancourt",
                    "Jorge Hernández",
                    "Punta Gorda",
                    "Arístides Calvani"
                ]
            },
            {
                municipio: "Catatumbo",
                capital: "Encontrados",
                parroquias: [
                    "Encontrados",
                    "Udón Pérez"
                ]
            },
            {
                municipio: "Colón",
                capital: "San Carlos del Zulia",
                parroquias: [
                    "Moralito",
                    "San Carlos del Zulia",
                    "Santa Cruz del Zulia",
                    "Santa Bárbara",
                    "Urribarrí"
                ]
            },
            {
                municipio: "Francisco Javier Pulgar",
                capital: "Pueblo Nuevo - El Chivo",
                parroquias: [
                    "Carlos Quevedo",
                    "Francisco Javier Pulgar",
                    "Simón Rodríguez",
                    "Guamo-Gavilanes"
                ]
            },
            {
                municipio: "Páez",
                capital: "Sinamaica",
                parroquias: [
                    "Sinamaica",
                    "Alta Guajira",
                    "Elías Sánchez Rubio",
                    "Guajira"
                ]
            },
            {
                municipio: "Jesús Enrique Lossada",
                capital: "La Concepción",
                parroquias: [
                    "La Concepción",
                    "San José",
                    "Mariano Parra León",
                    "José Ramón Yépez"
                ]
            },
            {
                municipio: "Jesús María Semprún",
                capital: "Casigua - El Cubo",
                parroquias: [
                    "Jesús María Semprún",
                    "Barí"
                ]
            },
            {
                municipio: "La Cañada de Urdaneta",
                capital: "La Concepción",
                parroquias: [
                    "Concepción",
                    "Andrés Bello",
                    "Chiquinquirá",
                    "El Carmelo",
                    "Potreritos"
                ]
            },
            {
                municipio: "Lagunillas",
                capital: "Ciudad Ojeda",
                parroquias: [
                    "Libertad",
                    "Alonso de Ojeda",
                    "Venezuela",
                    "Eleazar López Contreras",
                    "Campo Lara"
                ]
            },
            {
                municipio: "Machiques de Perijá",
                capital: "Machiques",
                parroquias: [
                    "Bartolomé de las Casas",
                    "Libertad",
                    "Río Negro",
                    "San José de Perijá"
                ]
            },
            {
                municipio: "Mara",
                capital: "San Rafael de El Moján",
                parroquias: [
                    "San Rafael",
                    "La Sierrita",
                    "Las Parcelas",
                    "Luis de Vicente",
                    "Monseñor Marcos Sergio Godoy",
                    "Ricaurte",
                    "Tamare"
                ]
            },
            {
                municipio: "Maracaibo",
                capital: "Maracaibo",
                parroquias: [
                    "Antonio Borjas Romero",
                    "Bolívar",
                    "Cacique Mara",
                    "Carracciolo Parra Pérez",
                    "Cecilio Acosta",
                    "Cristo de Aranza",
                    "Coquivacoa",
                    "Chiquinquirá",
                    "Francisco Eugenio Bustamante",
                    "Idelfonzo Vásquez",
                    "Juana de Ávila",
                    "Luis Hurtado Higuera",
                    "Manuel Dagnino",
                    "Olegario Villalobos.",
                    "Raúl Leoni",
                    "Santa Lucía",
                    "Venancio Pulgar",
                    "San Isidro"
                ]
            },
            {
                municipio: "Miranda",
                capital: "Los Puertos de Altagracia",
                parroquias: [
                    "Altagracia",
                    "Faría",
                    "Ana María Campos",
                    "San Antonio",
                    "San José"
                ]
            },
            {
                municipio: "Rosario de Perijá",
                capital: "La Villa del Rosario",
                parroquias: [
                    "Donaldo García",
                    "El Rosario",
                    "Sixto Zambrano"
                ]
            },
            {
                municipio: "San Francisco",
                capital: "San Francisco",
                parroquias: [
                    "San Francisco",
                    "El Bajo",
                    "Domitila Flores",
                    "Francisco Ochoa",
                    "Los Cortijos",
                    "Marcial Hernández"
                ]
            },
            {
                municipio: "Santa Rita",
                capital: "Santa Rita",
                parroquias: [
                    "Santa Rita",
                    "El Mene",
                    "Pedro Lucas Urribarrí",
                    "José Cenobio Urribarrí"
                ]
            },
            {
                municipio: "Simón Bolívar",
                capital: "Tía Juana",
                parroquias: [
                    "Rafael Maria Baralt",
                    "Manuel Manrique",
                    "Rafael Urdaneta"
                ]
            },
            {
                municipio: "Sucre",
                capital: "Bobures",
                parroquias: [
                    "Bobures",
                    "Gibraltar",
                    "Heras",
                    "Monseñor Arturo Álvarez",
                    "Rómulo Gallegos",
                    "El Batey"
                ]
            },
            {
                municipio: "Valmore Rodríguez",
                capital: "Bachaquero",
                parroquias: [
                    "Rafael Urdaneta",
                    "La Victoria",
                    "Raúl Cuenca"
                ]
            }
        ],
        ciudades: [
            "Bachaquero",
            "Bobures",
            "Cabimas",
            "Campo Concepción",
            "Campo Mara",
            "Campo Rojo",
            "Carrasquero",
            "Casigua",
            "Chiquinquirá",
            "Ciudad Ojeda",
            "El Batey",
            "El Carmelo",
            "El Chivo",
            "El Guayabo",
            "El Mene",
            "El Venado",
            "Encontrados",
            "Gibraltar",
            "Isla de Toas",
            "La Concepción",
            "La Paz",
            "La Sierrita",
            "Lagunillas",
            "Las Piedras",
            "Los Cortijos",
            "Machiques",
            "Maracaibo",
            "Mene Grande",
            "Palmarejo",
            "Paraguaipoa",
            "Potrerito",
            "Pueblo Nuevo",
            "Puertos de Altagracia",
            "Punta Gorda",
            "Sabaneta de Palma",
            "San Francisco",
            "San José de Perijá",
            "San Rafael del Moján",
            "San Timoteo",
            "Santa Bárbara del Zulia",
            "Santa Cruz de Mara",
            "Santa Cruz del Zulia",
            "Santa Rita",
            "Sinamaica",
            "Tamare",
            "Tía Juana",
            "Villa Rosario"
        ]
    },
    {
        iso_31662: "VE-A",
        estado: "Distrito Capital",
        capital: "Caracas",
        id_estado: 24,
        municipios: [
            {
                municipio: "Libertador",
                capital: "Caracas",
                parroquias: [
                    "23 de enero",
                    "Altagracia",
                    "Antímano",
                    "Caricuao",
                    "Catedral",
                    "Coche",
                    "El Junquito",
                    "El Paraíso",
                    "El Recreo",
                    "El Valle",
                    "Candelaria",
                    "La Pastora",
                    "La Vega",
                    "Macarao",
                    "San Agustín",
                    "San Bernardino",
                    "San José",
                    "San Juan",
                    "San Pedro",
                    "Santa Rosalía",
                    "Santa Teresa",
                    "Sucre (Catia)"
                ]
            }
        ],
        ciudades: []
    }
]

export const people = [
    {
        name: "Carlos",
        lastName: "Pérez",
        address: "Calle 12, casa 45",
        parishId: 1,
        email: "carlos.perez@example.com",
        phone: "+584141112233",
        identification: "V-20123456",
        sex: "M",
        birthdate: new Date("1985-04-12"),
    },
    {
        name: "María",
        lastName: "González",
        address: "Av. Bolívar, Edif. Solimar",
        parishId: 2,
        email: "maria.gonzalez@example.com",
        phone: "+584245667788",
        identification: "V-28976432",
        sex: "F",
        birthdate: new Date("1992-07-03"),
    },
    {
        name: "Luis",
        lastName: "Rodríguez",
        address: "Calle Sucre, Sector 5",
        parishId: 3,
        email: "luis.rodriguez@example.com",
        phone: "+584121234567",
        identification: "V-18345678",
        sex: "M",
        birthdate: new Date("1978-11-20"),
    },
    {
        name: "Ana",
        lastName: "Martínez",
        address: "Urbanización El Bosque",
        parishId: 4,
        email: "ana.martinez@example.com",
        phone: "+584166789012",
        identification: "V-27483920",
        sex: "F",
        birthdate: new Date("1995-01-18"),
    },
    {
        name: "Jorge",
        lastName: "Morales",
        address: "Barrio La Pastora",
        parishId: 5,
        email: "jorge.morales@example.com",
        phone: "+584149999999",
        identification: "V-20876543",
        sex: "M",
        birthdate: new Date("1980-03-25"),
    },
    {
        name: "Sofía",
        lastName: "Ramírez",
        address: "Residencias Altamira",
        parishId: 6,
        email: "sofia.ramirez@example.com",
        phone: "+584127777888",
        identification: "V-23456789",
        sex: "F",
        birthdate: new Date("1990-09-10"),
    },
    {
        name: "Pedro",
        lastName: "Fernández",
        address: "Callejón El Carmen",
        parishId: 7,
        email: "pedro.fernandez@example.com",
        phone: "+584144556677",
        identification: "V-21987654",
        sex: "M",
        birthdate: new Date("1975-05-30"),
    },
    {
        name: "Laura",
        lastName: "Hernández",
        address: "Zona Industrial Norte",
        parishId: 8,
        email: "laura.hernandez@example.com",
        phone: "+584264443322",
        identification: "V-29876543",
        sex: "F",
        birthdate: new Date("1988-08-22"),
    },
    {
        name: "Ricardo",
        lastName: "Delgado",
        address: "Centro Comercial Victoria",
        parishId: 9,
        email: "ricardo.delgado@example.com",
        phone: "+584126666555",
        identification: "V-26789901",
        sex: "M",
        birthdate: new Date("1983-12-05"),
    },
    {
        name: "Daniela",
        lastName: "Torres",
        address: "Calle Lara con Independencia",
        parishId: 10,
        email: "daniela.torres@example.com",
        phone: "+584147894561",
        identification: "V-30567891",
        sex: "F",
        birthdate: new Date("1997-02-14"),
    }
];

export const programs = [
    {
        program: "Programa de Salud",
        type: "Salud"
    },
    {
        program: "Programa de Educación",
        type: "Educación"
    },
    {
        program: "Programa de Alimentación",
        type: "Alimentación"
    },
    {
        program: "Programa de Musica",
        type: "Musica"
    },
    {
        program: "Programa de Agua",
        type: "Agua"
    }
]

export const forms = [
    { forms: 'Comprimidos' },
    { forms: 'Cápsulas' },
    { forms: 'Polvo' },
    { forms: 'Granulados' },
    { forms: 'Píldoras' },
    { forms: 'Óvulos' },
    { forms: 'Suspensión' },
    { forms: 'Ampollas' },
    { forms: 'Inyectables' },
    { forms: 'Emulsiones' },
    { forms: 'Colirios' },
    { forms: 'Supositorios' },
    { forms: 'Pomadas' },
    { forms: 'Ninguno' },
];

export const store = [
    {
        name: 'Almacen 1',
        address: 'Maracaibo',
    },
    {
        name: 'Almacen 2',
        address: 'Maracaibo',
    },
    {
        name: 'Almacen 3',
        address: 'Mara',
    },
    {
        name: 'Almacen 4',
        address: 'Mara',
    },
];

export const categories = [
    { category: "Analgésico" },
    { category: "Antiinflamatorio" },
    { category: "Antibiótico" },
    { category: "Antipirético" },
    { category: "Antiséptico" },
    { category: "Antihistamínico" },
    { category: "Antiácido" },
    { category: "Antidiarreico" },
    { category: "Antiviral" },
    { category: "Antifúngico" },
    { category: "Supresor de la Tos" },
    { category: "Descongestionante" },
    { category: "Relajante Muscular" },
    { category: "Antiespasmódico" },
    { category: "Vacuna" },
    { category: "Higiene Personal" },
    { category: "Salud y Bienestar" },
    { category: "Cuidado Infantil" },
    { category: "Suplemento Nutricional" },
    { category: "Productos de Limpieza" },
    { category: "Ropa" },
    { category: "Juguetes" },
    { category: "Equipos Médicos" },
    { category: "Equipos de Protección" },
    { category: "Alimentos y Bebidas" }
];

export const medicine = [
    {
        name: "Paracetamol",
        description: "Analgésico y antipirético para aliviar el dolor y reducir la fiebre.",
        categoryId: 1, // Analgésico
        medicine: true,
        unit: "mg",
        amount: 500,
        temperate: "Ambiente",
        manufacturer: "Genven",
        activeIngredient: "Paracetamol",
        formId: 1 // Comprimidos
    },
    {
        name: "Ibuprofeno",
        description: "Antiinflamatorio no esteroideo para tratar dolor e inflamación.",
        categoryId: 2, // Antiinflamatorio
        medicine: true,
        unit: "mg",
        amount: 400,
        temperate: "Ambiente",
        manufacturer: "Pfizer",
        activeIngredient: "Ibuprofeno",
        formId: 2 // Cápsulas
    },
    {
        name: "Amoxicilina",
        description: "Antibiótico de amplio espectro para infecciones bacterianas.",
        categoryId: 3, // Antibiótico
        medicine: true,
        unit: "mg",
        amount: 500,
        temperate: "Refrigerado",
        manufacturer: "Laboratorios Vargas",
        activeIngredient: "Amoxicilina",
        formId: 2 // Cápsulas
    },
    {
        name: "Loratadina",
        description: "Antihistamínico para aliviar los síntomas de la alergia.",
        categoryId: 6, // Antihistamínico
        medicine: true,
        unit: "mg",
        amount: 10,
        temperate: "Ambiente",
        manufacturer: "Bayer",
        activeIngredient: "Loratadina",
        formId: 1 // Comprimidos
    },
    {
        name: "Salbutamol",
        description: "Broncodilatador para el tratamiento del asma.",
        categoryId: 12, // Descongestionante
        medicine: true,
        unit: "mg",
        amount: 100,
        temperate: "Ambiente",
        manufacturer: "GlaxoSmithKline",
        activeIngredient: "Salbutamol",
        formId: 7 // Suspensión
    },
    {
        name: "Metronidazol",
        description: "Antibiótico y antiparasitario para infecciones vaginales y gastrointestinales.",
        categoryId: 3,
        medicine: true,
        unit: "mg",
        amount: 250,
        temperate: "Ambiente",
        manufacturer: "Genéricos C.A.",
        activeIngredient: "Metronidazol",
        formId: 1
    },
    {
        name: "Diclofenaco Sódico",
        description: "Antiinflamatorio para dolores musculares y articulares.",
        categoryId: 2,
        medicine: true,
        unit: "mg",
        amount: 75,
        temperate: "Ambiente",
        manufacturer: "Novartis",
        activeIngredient: "Diclofenaco",
        formId: 9 // Inyectables
    },
    {
        name: "Miconazol",
        description: "Antifúngico tópico para infecciones en la piel.",
        categoryId: 10, // Antifúngico
        medicine: true,
        unit: "g",
        amount: 20,
        temperate: "Ambiente",
        manufacturer: "Johnson & Johnson",
        activeIngredient: "Miconazol",
        formId: 13 // Pomadas
    },
    {
        name: "Omeprazol",
        description: "Antiácido utilizado para tratar reflujo y úlceras gástricas.",
        categoryId: 7,
        medicine: true,
        unit: "mg",
        amount: 20,
        temperate: "Ambiente",
        manufacturer: "Sandoz",
        activeIngredient: "Omeprazol",
        formId: 2
    },
    {
        name: "Suero Oral",
        description: "Solución oral para rehidratación.",
        categoryId: 4, // Antipirético o Suplemento
        medicine: true,
        unit: "ml",
        amount: 500,
        temperate: "Ambiente",
        manufacturer: "Farmatodo",
        activeIngredient: "Glucosa y electrolitos",
        formId: 7 // Suspensión
    }
];

export const products = [
    {
        name: "Pasta Dental Infantil",
        description: "Pasta dental con flúor para niños.",
        categoryId: 16, // Higiene Personal
        medicine: false,
        unit: "",
        amount: 0,
        temperate: "",
        manufacturer: "",
        activeIngredient: "",
        formId: 14 // Ninguno
    },
    {
        name: "Jabón Antibacterial",
        description: "Jabón líquido para higiene de manos.",
        categoryId: 16,
        medicine: false,
        unit: "",
        amount: 0,
        temperate: "",
        manufacturer: "",
        activeIngredient: "",
        formId: 14
    },
    {
        name: "Toallas Sanitarias",
        description: "Toallas higiénicas absorbentes para uso femenino.",
        categoryId: 16,
        medicine: false,
        unit: "",
        amount: 0,
        temperate: "",
        manufacturer: "",
        activeIngredient: "",
        formId: 14
    },
    {
        name: "Suplemento de Hierro",
        description: "Suplemento alimenticio con hierro.",
        categoryId: 19, // Suplemento Nutricional
        medicine: false,
        unit: "",
        amount: 0,
        temperate: "",
        manufacturer: "",
        activeIngredient: "",
        formId: 14
    },
    {
        name: "Kit de primeros auxilios",
        description: "Kit con elementos básicos de primeros auxilios.",
        categoryId: 21, // Equipos de Protección
        medicine: false,
        unit: "kit",
        amount: 1,
        temperate: "Ambiente",
        manufacturer: "Botiquín Express",
        activeIngredient: "-",
        formId: 14
    },
    {
        name: "Juguete Educativo",
        description: "Juguete didáctico para niños entre 2 y 5 años.",
        categoryId: 20, // Juguetes
        medicine: false,
        unit: "unidad",
        amount: 1,
        temperate: "Ambiente",
        manufacturer: "Fisher Price",
        activeIngredient: "-",
        formId: 14
    },
    {
        name: "Termómetro Digital",
        description: "Termómetro para medir la temperatura corporal.",
        categoryId: 21, // Equipos Médicos
        medicine: false,
        unit: "unidad",
        amount: 1,
        temperate: "Ambiente",
        manufacturer: "OMRON",
        activeIngredient: "-",
        formId: 14
    },
    {
        name: "Guantes Desechables",
        description: "Guantes de látex para uso médico o doméstico.",
        categoryId: 22, // Equipos de Protección
        medicine: false,
        unit: "pares",
        amount: 10,
        temperate: "Ambiente",
        manufacturer: "MediGlove",
        activeIngredient: "-",
        formId: 14
    },
    {
        name: "Pañales para bebés",
        description: "Pañales desechables ultra absorbentes.",
        categoryId: 17, // Cuidado Infantil
        medicine: false,
        unit: "unidades",
        amount: 30,
        temperate: "Ambiente",
        manufacturer: "Huggies",
        activeIngredient: "-",
        formId: 14
    },
    {
        name: "Cloro Líquido",
        description: "Desinfectante multiusos a base de cloro.",
        categoryId: 18, // Productos de Limpieza
        medicine: false,
        unit: "ml",
        amount: 1000,
        temperate: "Ambiente",
        manufacturer: "Clorox",
        activeIngredient: "Hipoclorito de sodio",
        formId: 14
    }
];

export const providers = [
    {
        name: "Farmacia El Sol",
        rif: "J0560276543650",
        address: "Av. La Limpia, Maracaibo",
        country: "Venezuela",
        email: "contacto@elsol.com.ve"
    },
    {
        name: "Distribuidora Médica Zuliana",
        rif: "J2948374650012",
        address: "Zona Industrial Sur, Maracaibo",
        country: "Venezuela",
        email: "ventas@dmzuliana.com"
    },
    {
        name: "Laboratorios Vida Sana",
        rif: "J1039284756211",
        address: "Av. Baralt, Caracas",
        country: "Venezuela",
        email: "info@vidasana.com.ve"
    },
    {
        name: "Provefarma C.A.",
        rif: "J2876543210987",
        address: "Calle 100, Valencia",
        country: "Venezuela",
        email: "proveedores@provefarma.com"
    },
    {
        name: "Fundación Medic Venezuela",
        rif: "J1983746500032",
        address: "Av. Libertador, Caracas",
        country: "Venezuela",
        email: "donaciones@medicvenezuela.org"
    },
    {
        name: "Salud Total Internacional",
        rif: "J2783645000172",
        address: "Av. San Martín, Caracas",
        country: "Colombia",
        email: "contact@saludtotal.co"
    },
    {
        name: "Cruz Roja Zulia",
        rif: "J0098765432100",
        address: "Calle 72, Maracaibo",
        country: "Venezuela",
        email: "ayuda@cruzrojazulia.org"
    },
    {
        name: "Médicos Sin Fronteras",
        rif: "J1234567890123",
        address: "Oficinas en Caracas",
        country: "Francia",
        email: "venezuela@msf.org"
    },
    {
        name: "Donaciones Esperanza",
        rif: "J3344556677889",
        address: "Av. Los Próceres, Barquisimeto",
        country: "Venezuela",
        email: "contacto@esperanza.org.ve"
    },
    {
        name: "Farmadistribuciones Lara",
        rif: "J9988776655443",
        address: "Zona Franca, Barquisimeto",
        country: "Venezuela",
        email: "info@farmalara.com.ve"
    }
];

export const providerDB = [
    {
        name: "DIRECT RELIEF",
        rif: "N/A",
        country: 'Venezuela',
        address:'',
        email: '',
    },
    {
        name: "COLGATE-PALMOLIVE",
        rif: "J-00007195-0",
        country: 'Venezuela',
        address:'',
        email: '',
    },
    {
        name: "CALOX",
        rif: "N/A",
        country: 'Venezuela',
        address:'',
        email: '',
    },
    {
        name: "COBECA",
        rif: "N/A",
        country: 'Venezuela',
        address:'',
        email: '',
    },
    {
        name: "INSTITUTO MUNICIPAL DE LA SALUD DE SANTA RITA",
        rif: "N/A",
        country: 'Venezuela',
        address:'',
        email: '',
    },
    {
        name: "BRIUTCARE",
        rif: "N/A",
        country: 'Venezuela',
        address:'',
        email: '',
    },
];
