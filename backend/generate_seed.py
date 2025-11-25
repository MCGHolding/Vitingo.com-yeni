# Script to generate comprehensive seed data for 195 UN countries

# Major countries with 20 cities each
MAJOR_COUNTRIES_CITIES = {
    "Türkiye": ["İstanbul", "Ankara", "İzmir", "Bursa", "Adana", "Antalya", "Gaziantep", "Konya", "Kayseri", "Mersin", "Diyarbakır", "Eskişehir", "Şanlıurfa", "Malatya", "Kahramanmaraş", "Erzurum", "Van", "Denizli", "Samsun", "Balıkesir"],
    "Amerika Birleşik Devletleri": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Boston"],
    "Birleşik Krallık": ["Londra", "Birmingham", "Manchester", "Liverpool", "Leeds", "Newcastle", "Sheffield", "Bristol", "Edinburgh", "Glasgow", "Leicester", "Nottingham", "Cardiff", "Belfast", "Southampton", "Bradford", "Plymouth", "Derby", "Portsmouth", "Stoke-on-Trent"],
    "Almanya": ["Berlin", "Hamburg", "Münih", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hannover", "Nürnberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"],
    "Fransa": ["Paris", "Marsilya", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Saint-Étienne", "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"],
    "İtalya": ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Cenova", "Bologna", "Floransa", "Bari", "Catania", "Verona", "Venedik", "Messina", "Padova", "Trieste", "Taranto", "Brescia", "Parma", "Prato", "Modena"],
    "İspanya": ["Madrid", "Barselona", "Valencia", "Sevilla", "Zaragoza", "Malaga", "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "L'Hospitalet", "Granada", "Vitoria", "Elche", "Oviedo"],
    "Çin": ["Şangay", "Pekin", "Guangzhou", "Shenzhen", "Chengdu", "Tianjin", "Chongqing", "Wuhan", "Hangzhou", "Nanjing", "Xi'an", "Shenyang", "Harbin", "Qingdao", "Jinan", "Dalian", "Zhengzhou", "Kunming", "Changsha", "Taiyuan"],
    "Japonya": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara", "Shizuoka"],
    "Hindistan": ["Mumbai", "Delhi", "Bangalore", "Haydarabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"],
    "Brezilya": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre", "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Campo Grande"],
    "Rusya": ["Moskova", "Sankt Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk"],
    "Kanada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "Sherbrooke", "St. John's", "Barrie"],
    "Avustralya": ["Sidney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong", "Hobart", "Geelong", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston"],
    "Meksika": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Zapopan", "Mérida", "San Luis Potosí", "Aguascalientes", "Hermosillo", "Saltillo", "Mexicali", "Culiacán", "Querétaro", "Chihuahua", "Morelia", "Toluca", "Cancún"],
    "Güney Kore": ["Seul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Goyang", "Yongin", "Seongnam", "Changwon", "Bucheon", "Cheongju", "Ansan", "Jeonju", "Anyang", "Pohang", "Cheonan", "Namyangju"],
    "Endonezya": ["Jakarta", "Surabaya", "Bandung", "Bekasi", "Medan", "Depok", "Tangerang", "Palembang", "Semarang", "Makassar", "South Tangerang", "Batam", "Bogor", "Pekanbaru", "Bandar Lampung", "Padang", "Malang", "Denpasar", "Surakarta", "Balikpapan"],
    "Hollanda": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "s-Hertogenbosch", "Hoofddorp", "Maastricht", "Leiden"],
    "Suudi Arabistan": ["Riyad", "Cidde", "Mekke", "Medine", "Dammam", "Taif", "Buraidah", "Tabük", "Khamis Mushayt", "Hofuf", "Haradh", "Khobar", "Jubail", "Hafar Al-Batin", "Yanbu", "Abha", "Najran", "Arar", "Sakaka", "Jizan"],
    "İsviçre": ["Zürih", "Cenevre", "Basel", "Bern", "Lozan", "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel", "Thun", "Köniz", "La Chaux-de-Fonds", "Schaffhausen", "Fribourg", "Vernier", "Chur", "Neuchâtel", "Uster", "Sion"],
    # Additional 15 countries
    "Polonya": ["Varşova", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice", "Białystok", "Gdynia", "Częstochowa", "Radom", "Sosnowiec", "Toruń", "Kielce", "Gliwice", "Zabrze", "Bytom"],
    "Belçika": ["Brüksel", "Antwerp", "Gent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière", "Kortrijk", "Hasselt", "Oostende", "Genk", "Sint-Niklaas", "Tournai", "Seraing", "Roeselare"],
    "Avusturya": ["Viyana", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn", "Wiener Neustadt", "Steyr", "Feldkirch", "Bregenz", "Leonding", "Klosterneuburg", "Baden", "Wolfsberg", "Leoben", "Krems"],
    "İsveç": ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", "Södertälje", "Eskilstuna", "Halmstad", "Växjö", "Karlstad", "Sundsvall"],
    "Norveç": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Sandnes", "Tromsø", "Sarpsborg", "Skien", "Ålesund", "Sandefjord", "Haugesund", "Tønsberg", "Moss", "Bodø", "Arendal", "Hamar", "Larvik"],
    "Danimarka": ["Kopenhag", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Silkeborg", "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro", "Taastrup", "Slagelse", "Hillerød"],
    "Portekiz": ["Lizbon", "Porto", "Braga", "Setúbal", "Coimbra", "Funchal", "Amadora", "Almada", "Agualva-Cacém", "Queluz", "Guimarães", "Odivelas", "Matosinhos", "Évora", "Rio Tinto", "Aveiro", "Gondomar", "Póvoa de Varzim", "Corroios", "Esposende"],
    "Yunanistan": ["Atina", "Selanik", "Patras", "İraklio", "Larissa", "Volos", "Rodhos", "İoannina", "Chania", "Chalcis", "Agrinio", "Katerini", "Kalamata", "Kavala", "Kozani", "Serres", "Veria", "Alexandroupoli", "Drama", "Tripoli"],
    "İrlanda": ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Dundalk", "Swords", "Bray", "Navan", "Ennis", "Tralee", "Carlow", "Newbridge", "Naas", "Kilkenny", "Sligo", "Clonmel", "Wexford", "Mullingar"],
    "Yeni Zelanda": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua", "New Plymouth", "Whangarei", "Invercargill", "Whanganui", "Gisborne", "Timaru", "Masterton", "Levin", "Taupo", "Blenheim"],
    "Singapur": ["Singapur", "Jurong", "Woodlands", "Tampines", "Bedok", "Yishun", "Hougang", "Ang Mo Kio", "Choa Chu Kang", "Sembawang", "Punggol", "Sengkang", "Bukit Batok", "Pasir Ris", "Bukit Panjang", "Clementi", "Queenstown", "Toa Payoh", "Kallang", "Bishan"],
    "Birleşik Arap Emirlikleri": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dibba Al-Fujairah", "Dhaid", "Jebel Ali", "Ruwais", "Liwa", "Ghayathi", "Madinat Zayed", "Al Dhafra", "Zayed City", "Sweihan", "Al Wathba"],
    "Arjantin": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Resistencia", "Neuquén", "Santiago del Estero", "Corrientes", "Bahía Blanca", "Posadas", "Paraná", "San Salvador de Jujuy", "Formosa", "San Luis"],
    "Şili": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Chillán", "Iquique", "Puerto Montt", "Los Ángeles", "Coquimbo", "Osorno", "Valdivia", "Punta Arenas", "Copiapó", "Quillota", "Curicó"],
    "Kolombiya": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué", "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "Buenaventura"],
    # Additional 15 countries (Round 2)
    "Pakistan": ["Karaçi", "Lahor", "Faisalabad", "Rawalpindi", "Multan", "Haydarabad", "Gujranwala", "Peşaver", "Quetta", "İslamabad", "Sargodha", "Sialkot", "Bahawalpur", "Sukkur", "Jhang", "Sheikhupura", "Larkana", "Gujrat", "Mardan", "Kasur"],
    "Bangladeş": ["Dakka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Rangpur", "Barisal", "Comilla", "Mymensingh", "Narayanganj", "Gazipur", "Jessore", "Cox's Bazar", "Bogra", "Dinajpur", "Tangail", "Kushtia", "Pabna", "Brahmanbaria", "Noakhali"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", "Bien Hoa", "Hue", "Nha Trang", "Buon Ma Thuot", "Vung Tau", "Quy Nhon", "Nam Dinh", "Thai Nguyen", "Phan Thiet", "Long Xuyen", "Thai Binh", "Rach Gia", "Vinh", "My Tho", "Da Lat"],
    "Tayland": ["Bangkok", "Nonthaburi", "Pak Kret", "Hat Yai", "Chiang Mai", "Udon Thani", "Surat Thani", "Nakhon Ratchasima", "Chon Buri", "Lampang", "Khon Kaen", "Phuket", "Rayong", "Yala", "Ubon Ratchathani", "Nakhon Si Thammarat", "Chiang Rai", "Pattaya", "Saraburi", "Songkhla"],
    "Filipinler": ["Manila", "Quezon City", "Davao", "Caloocan", "Cebu City", "Zamboanga", "Taguig", "Antipolo", "Pasig", "Cagayan de Oro", "Dasmariñas", "Valenzuela", "Bacoor", "General Santos", "Las Piñas", "Makati", "Bacolod", "Iloilo City", "Parañaque", "Muntinlupa"],
    "Mısır": ["Kahire", "İskenderiye", "Giza", "Şubra el-Hayma", "Port Said", "Süveyş", "Luksor", "El-Mansure", "El-Mahalle el-Kubra", "Tanta", "Asyut", "İsmailia", "Fayum", "Zagazig", "Aswan", "Damietta", "Damanhur", "El-Minya", "Beni Suef", "Qena"],
    "Nijerya": ["Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Oyo", "Enugu", "Abeokuta", "Kaduna", "Sokoto", "Onitsha", "Warri", "Ebute Ikorodu", "Okene"],
    "Güney Afrika": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Vereeniging", "Welkom", "Pietermaritzburg", "Kimberley", "Rustenburg", "Polokwane", "Nelspruit", "George", "Richards Bay", "Midrand", "Centurion", "Boksburg", "Krugersdorp"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Ruiru", "Kikuyu", "Kangundo-Tala", "Malindi", "Mavoko", "Thika", "Garissa", "Kakamega", "Kitale", "Lamu", "Nyeri", "Naivasha", "Machakos", "Meru", "Kisii"],
    "İsrail": ["Tel Aviv", "Kudüs", "Hayfa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba", "Holon", "Bnei Brak", "Ramat Gan", "Ashkelon", "Rehovot", "Bat Yam", "Bet Shemesh", "Kfar Saba", "Herzliya", "Hadera", "Modi'in", "Nazareth"],
    "Çek Cumhuriyeti": ["Prag", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "Ústí nad Labem", "České Budějovice", "Hradec Králové", "Pardubice", "Zlín", "Havířov", "Kladno", "Most", "Opava", "Frýdek-Místek", "Karviná", "Jihlava", "Teplice", "Děčín"],
    "Romanya": ["Bükreş", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani", "Satu Mare"],
    "Peru": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Huancayo", "Chimbote", "Pucallpa", "Tacna", "Ica", "Juliaca", "Sullana", "Ayacucho", "Chincha Alta", "Cajamarca", "Puno", "Tarapoto", "Huánuco"],
    "Ekvador": ["Guayaquil", "Quito", "Cuenca", "Santo Domingo", "Machala", "Durán", "Manta", "Portoviejo", "Loja", "Ambato", "Esmeraldas", "Quevedo", "Riobamba", "Milagro", "Ibarra", "La Libertad", "Babahoyo", "Sangolquí", "Daule", "Latacunga"],
    "Malezya": ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Johor Bahru", "Subang Jaya", "Malacca City", "Kuching", "Kota Kinabalu", "Seremban", "Klang", "Ampang Jaya", "Sandakan", "Kuantan", "Kota Bharu", "Alor Setar", "Taiping", "Tawau", "Miri"],
    # A harfi ile başlayan ülkeler (eksik olanlar)
    "Afganistan": ["Kabil", "Kandahar", "Herat", "Mezar-ı Şerif", "Celalabad", "Kunduz", "Lashkar Gah", "Taloqan", "Puli Khumri", "Sar-e Pol", "Ghazni", "Khost", "Shiberghan", "Aybak", "Gardez", "Zaranj", "Mahmud-e Raqi", "Farah", "Fayzabad", "Baghlan"],
    "Arnavutluk": ["Tiran", "Dürres", "Vlora", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", "Lushnjë", "Kavajë", "Gjirokastër", "Kukës", "Laç", "Krujë", "Lezhë", "Pogradec", "Sarandë", "Patos", "Peshkopi", "Kuçovë"],
    "Cezayir": ["Cezayir", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "El Oued", "Skikda", "Tiaret", "Béjaïa", "Tlemcen", "Béchar", "Mostaganem", "Bordj Bou Arréridj", "Chlef"],
    "Andorra": ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria", "La Massana", "Santa Coloma", "Ordino", "Canillo", "Arinsal", "El Pas de la Casa", "Soldeu", "La Cortinada", "Aixovall", "Llorts", "Sispony", "Anyós", "Arans", "Erts", "Juberri", "Fontaneda"],
    "Angola": ["Luanda", "Huambo", "Lobito", "Benguela", "Kuito", "Lubango", "Malanje", "Namibe", "Soyo", "Cabinda", "Uíge", "Saurimo", "Sumbe", "Menongue", "Dundo", "Ondjiva", "Lucapa", "Caxito", "N'dalatando", "Caála"],
    "Antigua ve Barbuda": ["St. John's", "All Saints", "Liberta", "Potter's Village", "Bolans", "Swetes", "Seaview Farm", "Pigotts", "Parham", "Clare Hall", "Willikies", "Codrington", "English Harbour", "Falmouth", "Old Road", "Jennings", "Five Islands", "Cedar Grove", "Freetown", "Urlings"],
    "Ermenistan": ["Erivan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Kapan", "Armavir", "Gavar", "Artashat", "Goris", "Ashtarak", "Sevan", "Charentsavan", "Dilijan", "Spitak", "Ijevan", "Yeghvard", "Metsamor", "Vardenis"],
    "Azerbaycan": ["Bakü", "Gəncə", "Sumqayıt", "Mingəçevir", "Qaraçuxur", "Şirvan", "Naxçıvan", "Yevlax", "Lankaran", "Xankəndi", "Şəki", "Naftalan", "Quba", "Qəbələ", "Qusar", "Ağdam", "Ağdaş", "Astara", "Balakən", "Bərdə"],
    # B harfi ile başlayan ülkeler (eksikler)
    "Bahamalar": ["Nassau", "Lucaya", "Freeport", "West End", "Coopers Town", "Marsh Harbour", "Freetown", "High Rock", "Andros Town", "Spanish Wells", "Clarence Town", "George Town", "Matthew Town", "Arthur's Town", "Port Nelson", "Colonel Hill", "Cockburn Town", "Duncan Town", "Pirates Well", "Abraham's Bay"],
    "Bahreyn": ["Manama", "Al Muharraq", "Riffa", "Dar Kulayb", "Madīnat Ḥamad", "A'ali", "Isa Town", "Sitra", "Budaiya", "Jidhafs", "Al-Malikiyah", "Sanabis", "Tubli", "Madinat Isa", "Diraz", "Barbar", "Karzakkan", "Saar", "Dumistan", "Karbabad"],
    "Barbados": ["Bridgetown", "Speightstown", "Oistins", "Bathsheba", "Holetown", "Crane", "Six Cross Roads", "The Garden", "Blackmans", "Mullins", "Greenidge", "Boarded Hall", "Checker Hall", "Crab Hill", "Pie Corner", "Paynes Bay", "Sunset Crest", "Fitts Village", "Porters", "Jackson"],
    "Belarus": ["Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest", "Bobruisk", "Baranovichi", "Borisov", "Pinsk", "Orsha", "Mozyr", "Soligorsk", "Novopolotsk", "Lida", "Molodechno", "Polotsk", "Zhlobin", "Svetlogorsk", "Rechitsa"],
    "Belize": ["Belize City", "San Ignacio", "Belmopan", "Orange Walk", "Dangriga", "Corozal", "San Pedro", "Benque Viejo del Carmen", "Punta Gorda", "Valley of Peace", "Independence", "Ladyville", "Hattieville", "Hopkins", "Placencia", "Caye Caulker", "Sarteneja", "Maskall", "Burrell Boom", "Crooked Tree"],
    "Benin": ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Bohicon", "Kandi", "Lokossa", "Ouidah", "Abomey", "Natitingou", "Save", "Malanville", "Pobé", "Kétou", "Sakété", "Comè", "Bassila", "Banikoara", "Nikki", "Bembèrèkè"],
    "Butan": ["Thimphu", "Phuntsholing", "Punakha", "Gelephu", "Paro", "Wangdue Phodrang", "Samdrup Jongkhar", "Mongar", "Trashigang", "Trongsa", "Pemagatshel", "Jakar", "Dagana", "Lhuntse", "Gasa", "Zhemgang", "Haa", "Samtse", "Panbang", "Damphu"],
    "Bolivya": ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto", "Montero", "Trinidad", "Riberalta", "Guayaramerín", "Cobija", "Yacuiba", "Quillacollo", "Sacaba", "Warnes", "Tupiza", "Villazón", "Camiri"],
    "Bosna-Hersek": ["Saraybosna", "Banja Luka", "Tuzla", "Zenica", "Mostar", "Bijeljina", "Brčko", "Prijedor", "Trebinje", "Cazin", "Doboj", "Sanski Most", "Gradiška", "Goražde", "Livno", "Konjic", "Višegrad", "Foča", "Bugojno", "Zvornik"],
    "Botsvana": ["Gaborone", "Francistown", "Molepolole", "Maun", "Selebi-Phikwe", "Serowe", "Kanye", "Mochudi", "Lobatse", "Palapye", "Ramotswa", "Tlokweng", "Jwaneng", "Kasane", "Letlhakane", "Mogoditshane", "Tonota", "Mahalapye", "Moshupa", "Thamaga"],
    "Brunei": ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong", "Bangar", "Muara", "Sukang", "Panaga", "Lumut", "Labi", "Sungai Liang", "Kampong Ayer", "Berakas", "Gadong", "Mentiri", "Kilanas", "Sengkurong", "Lamunin", "Bukit Sawat", "Rambai"],
    "Bulgaristan": ["Sofya", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen", "Pernik", "Yambol", "Haskovo", "Pazardzhik", "Blagoevgrad", "Veliko Tarnovo", "Vratsa", "Gabrovo", "Asenovgrad", "Vidin"],
    "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora", "Dédougou", "Kaya", "Tenkodogo", "Fada N'gourma", "Houndé", "Réo", "Gaoua", "Dori", "Manga", "Djibo", "Pouytenga", "Nouna", "Kongoussi", "Ziniaré", "Koupéla"],
    "Burundi": ["Bujumbura", "Gitega", "Muyinga", "Ngozi", "Ruyigi", "Kayanza", "Bururi", "Makamba", "Muramvya", "Cibitoke", "Bubanza", "Cankuzo", "Karuzi", "Kirundo", "Rutana", "Mwaro", "Rumonge", "Isale", "Matana", "Nyanza-Lac"],
    # C harfi ile başlayan ülkeler (eksikler)
    "Cibuti": ["Cibuti City", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta", "Holhol", "Yoboki", "As Eyla", "Dorra", "Loyada", "Khor Angar", "Randa", "Balho", "Galafi", "Ali Adde", "Day", "Goubetto", "Gâlâfi", "Daimoli"],
    "Çad": ["N'Djamena", "Moundou", "Sarh", "Abéché", "Kelo", "Koumra", "Pala", "Am Timan", "Bongor", "Mongo", "Doba", "Ati", "Laï", "Faya-Largeau", "Biltine", "Moïssala", "Massaguet", "Goz Beïda", "Massakory", "Bol"],
    # D harfi ile başlayan ülkeler (eksikler)
    "Dominika": ["Roseau", "Portsmouth", "Marigot", "Berekua", "Mahaut", "Saint Joseph", "Wesley", "Soufrière", "Salisbury", "Castle Bruce", "La Plaine", "Colihaut", "Calibishie", "Pointe Michel", "Grand Bay", "Woodford Hill", "Vieille Case", "Petite Savanne", "Penville", "Pichelin"],
    "Dominik Cumhuriyeti": ["Santo Domingo", "Santiago de los Caballeros", "La Romana", "San Pedro de Macorís", "San Cristóbal", "Puerto Plata", "San Francisco de Macorís", "La Vega", "Higüey", "Concepción de La Vega", "Moca", "Baní", "Bonao", "San Juan de la Maguana", "Azua", "Barahona", "Hato Mayor", "Monte Plata", "Cotuí", "Esperanza"],
    "Doğu Timor": ["Dili", "Baucau", "Maliana", "Suai", "Liquiçá", "Aileu", "Manatuto", "Same", "Lospalos", "Gleno", "Viqueque", "Ermera", "Ainaro", "Bazartete", "Maubara", "Atsabe", "Bobonaro", "Lautem", "Covalima", "Oecusse"]
}

# Generate Python code
output = []
output.append("# Complete 195 UN Member Countries with major cities")
output.append("# Generated automatically - DO NOT EDIT MANUALLY")
output.append("")

# Countries list
output.append("COUNTRIES_195 = [")
countries_list = [
    ('AF', 'Afganistan'), ('AL', 'Arnavutluk'), ('DZ', 'Cezayir'), ('AD', 'Andorra'), ('AO', 'Angola'),
    ('AG', 'Antigua ve Barbuda'), ('AR', 'Arjantin'), ('AM', 'Ermenistan'), ('AU', 'Avustralya'), ('AT', 'Avusturya'),
    ('AZ', 'Azerbaycan'), ('BS', 'Bahamalar'), ('BH', 'Bahreyn'), ('BD', 'Bangladeş'), ('BB', 'Barbados'),
    ('BY', 'Belarus'), ('BE', 'Belçika'), ('BZ', 'Belize'), ('BJ', 'Benin'), ('BT', 'Butan'),
    ('BO', 'Bolivya'), ('BA', 'Bosna-Hersek'), ('BW', 'Botsvana'), ('BR', 'Brezilya'), ('BN', 'Brunei'),
    ('BG', 'Bulgaristan'), ('BF', 'Burkina Faso'), ('BI', 'Burundi'), ('CV', 'Yeşil Burun Adaları'), ('KH', 'Kamboçya'),
    ('CM', 'Kamerun'), ('CA', 'Kanada'), ('CF', 'Orta Afrika Cumhuriyeti'), ('TD', 'Çad'), ('CL', 'Şili'),
    ('CN', 'Çin'), ('CO', 'Kolombiya'), ('KM', 'Komorlar'), ('CG', 'Kongo Cumhuriyeti'), ('CR', 'Kosta Rika'),
    ('HR', 'Hırvatistan'), ('CU', 'Küba'), ('CY', 'Kıbrıs'), ('CZ', 'Çek Cumhuriyeti'), ('CD', 'Kongo Demokratik Cumhuriyeti'),
    ('DK', 'Danimarka'), ('DJ', 'Cibuti'), ('DM', 'Dominika'), ('DO', 'Dominik Cumhuriyeti'), ('EC', 'Ekvador'),
    ('EG', 'Mısır'), ('SV', 'El Salvador'), ('GQ', 'Ekvator Ginesi'), ('ER', 'Eritre'), ('EE', 'Estonya'),
    ('SZ', 'Esvatini'), ('ET', 'Etiyopya'), ('FJ', 'Fiji'), ('FI', 'Finlandiya'), ('FR', 'Fransa'),
    ('GA', 'Gabon'), ('GM', 'Gambiya'), ('GE', 'Gürcistan'), ('DE', 'Almanya'), ('GH', 'Gana'),
    ('GR', 'Yunanistan'), ('GD', 'Grenada'), ('GT', 'Guatemala'), ('GN', 'Gine'), ('GW', 'Gine-Bissau'),
    ('GY', 'Guyana'), ('HT', 'Haiti'), ('VA', 'Vatikan'), ('HN', 'Honduras'), ('HU', 'Macaristan'),
    ('IS', 'İzlanda'), ('IN', 'Hindistan'), ('ID', 'Endonezya'), ('IR', 'İran'), ('IQ', 'Irak'),
    ('IE', 'İrlanda'), ('IL', 'İsrail'), ('IT', 'İtalya'), ('CI', 'Fildişi Sahili'), ('JM', 'Jamaika'),
    ('JP', 'Japonya'), ('JO', 'Ürdün'), ('KZ', 'Kazakistan'), ('KE', 'Kenya'), ('KI', 'Kiribati'),
    ('KW', 'Kuveyt'), ('KG', 'Kırgızistan'), ('LA', 'Laos'), ('LV', 'Letonya'), ('LB', 'Lübnan'),
    ('LS', 'Lesotho'), ('LR', 'Liberya'), ('LY', 'Libya'), ('LI', 'Lihtenştayn'), ('LT', 'Litvanya'),
    ('LU', 'Lüksemburg'), ('MG', 'Madagaskar'), ('MW', 'Malavi'), ('MY', 'Malezya'), ('MV', 'Maldivler'),
    ('ML', 'Mali'), ('MT', 'Malta'), ('MH', 'Marshall Adaları'), ('MR', 'Moritanya'), ('MU', 'Mauritius'),
    ('MX', 'Meksika'), ('FM', 'Mikronezya'), ('MD', 'Moldova'), ('MC', 'Monako'), ('MN', 'Moğolistan'),
    ('ME', 'Karadağ'), ('MA', 'Fas'), ('MZ', 'Mozambik'), ('MM', 'Myanmar'), ('NA', 'Namibya'),
    ('NR', 'Nauru'), ('NP', 'Nepal'), ('NL', 'Hollanda'), ('NZ', 'Yeni Zelanda'), ('NI', 'Nikaragua'),
    ('NE', 'Nijer'), ('NG', 'Nijerya'), ('KP', 'Kuzey Kore'), ('MK', 'Kuzey Makedonya'), ('NO', 'Norveç'),
    ('OM', 'Umman'), ('PK', 'Pakistan'), ('PW', 'Palau'), ('PS', 'Filistin'), ('PA', 'Panama'),
    ('PG', 'Papua Yeni Gine'), ('PY', 'Paraguay'), ('PE', 'Peru'), ('PH', 'Filipinler'), ('PL', 'Polonya'),
    ('PT', 'Portekiz'), ('QA', 'Katar'), ('RO', 'Romanya'), ('RU', 'Rusya'), ('RW', 'Ruanda'),
    ('KN', 'Saint Kitts ve Nevis'), ('LC', 'Saint Lucia'), ('VC', 'Saint Vincent ve Grenadinler'), ('WS', 'Samoa'), ('SM', 'San Marino'),
    ('ST', 'São Tomé ve Príncipe'), ('SA', 'Suudi Arabistan'), ('SN', 'Senegal'), ('RS', 'Sırbistan'), ('SC', 'Seyşeller'),
    ('SL', 'Sierra Leone'), ('SG', 'Singapur'), ('SK', 'Slovakya'), ('SI', 'Slovenya'), ('SB', 'Solomon Adaları'),
    ('SO', 'Somali'), ('ZA', 'Güney Afrika'), ('KR', 'Güney Kore'), ('SS', 'Güney Sudan'), ('ES', 'İspanya'),
    ('LK', 'Sri Lanka'), ('SD', 'Sudan'), ('SR', 'Surinam'), ('SE', 'İsveç'), ('CH', 'İsviçre'),
    ('SY', 'Suriye'), ('TJ', 'Tacikistan'), ('TZ', 'Tanzanya'), ('TH', 'Tayland'), ('TL', 'Doğu Timor'),
    ('TG', 'Togo'), ('TO', 'Tonga'), ('TT', 'Trinidad ve Tobago'), ('TN', 'Tunus'), ('TR', 'Türkiye'),
    ('TM', 'Türkmenistan'), ('TV', 'Tuvalu'), ('UG', 'Uganda'), ('UA', 'Ukrayna'), ('AE', 'Birleşik Arap Emirlikleri'),
    ('GB', 'Birleşik Krallık'), ('US', 'Amerika Birleşik Devletleri'), ('UY', 'Uruguay'), ('UZ', 'Özbekistan'), ('VU', 'Vanuatu'),
    ('VE', 'Venezuela'), ('VN', 'Vietnam'), ('YE', 'Yemen'), ('ZM', 'Zambiya'), ('ZW', 'Zimbabve')
]

for code, name in countries_list:
    output.append(f'    {{"id": "{code}", "name": "{name}", "code": "{code}"}},')
output.append("]")
output.append("")

# Cities list
output.append("ALL_CITIES = [")
city_id_counter = 1
for country_name, cities in MAJOR_COUNTRIES_CITIES.items():
    code = [c[0] for c in countries_list if c[1] == country_name][0] if country_name in [c[1] for c in countries_list] else "XX"
    output.append(f"    # {country_name} ({code}) - {len(cities)} major cities")
    for city in cities:
        output.append(f'    {{"id": "{code}-{city_id_counter}", "name": "{city}", "country": "{country_name}", "countryCode": "{code}"}},')
        city_id_counter += 1
    output.append("")

output.append("]")
output.append("")
output.append("COUNTRIES_AND_CITIES_SEED = {")
output.append('    "countries": COUNTRIES_195,')
output.append('    "cities": ALL_CITIES')
output.append("}")

# Write to file
with open('/app/backend/seed_data.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f"✅ Generated seed_data.py with {len(countries_list)} countries and cities for {len(MAJOR_COUNTRIES_CITIES)} major countries")
print(f"Total cities: ~{sum(len(cities) for cities in MAJOR_COUNTRIES_CITIES.values())}")
