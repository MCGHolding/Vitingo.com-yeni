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
    "Doğu Timor": ["Dili", "Baucau", "Maliana", "Suai", "Liquiçá", "Aileu", "Manatuto", "Same", "Lospalos", "Gleno", "Viqueque", "Ermera", "Ainaro", "Bazartete", "Maubara", "Atsabe", "Bobonaro", "Lautem", "Covalima", "Oecusse"],
    # E harfi ile başlayan ülkeler (eksikler)
    "Ekvator Ginesi": ["Malabo", "Bata", "Ebebiyin", "Aconibe", "Añisoc", "Luba", "Evinayong", "Mongomo", "Mengomeyén", "Pale", "Mbini", "Rebola", "Santiago de Baney", "San Antonio de Palé", "Riaba", "Baney", "Moca", "Ureca", "Bilelipa", "Kogo"],
    "El Salvador": ["San Salvador", "Soyapango", "Santa Ana", "San Miguel", "Mejicanos", "Santa Tecla", "Apopa", "Delgado", "Sonsonate", "Ahuachapán", "San Marcos", "Usulután", "Cojutepeque", "Ilopango", "Zacatecoluca", "Chalatenango", "La Unión", "Sensuntepeque", "San Vicente", "Metapán"],
    "Eritre": ["Asmara", "Keren", "Massawa", "Assab", "Mendefera", "Barentu", "Adi Keyh", "Adi Quala", "Dekemhare", "Tesseney", "Areza", "Ghinda", "Mai Habar", "Senafe", "Edd", "Nefasit", "Himbirti", "Segeneiti", "Zula", "Beylul"],
    "Estonya": ["Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", "Maardu", "Sillamäe", "Kuressaare", "Võru", "Valga", "Haapsalu", "Jõhvi", "Paide", "Keila", "Kiviõli", "Tapa", "Põlva", "Türi"],
    "Esvatini": ["Mbabane", "Manzini", "Lobamba", "Big Bend", "Malkerns", "Nhlangano", "Siteki", "Piggs Peak", "Hluti", "Simunye", "Bhunya", "Kwaluseni", "Hlatikulu", "Kubuta", "Lavumisa", "Mankayane", "Ngwempisi", "Vuvulane", "Sidvokodvo", "Lomahasha"],
    "Etiyopya": ["Addis Ababa", "Dire Dawa", "Mekele", "Gondar", "Awassa", "Bahir Dar", "Jimma", "Bishoftu", "Dessie", "Jijiga", "Shashamane", "Harar", "Dilla", "Nekemte", "Debre Birhan", "Asela", "Debre Markos", "Kombolcha", "Hosaena", "Harar"],
    # F harfi ile başlayan ülkeler (eksikler)
    "Fiji": ["Suva", "Nasinu", "Lautoka", "Nadi", "Labasa", "Ba", "Sigatoka", "Tavua", "Rakiraki", "Levuka", "Nausori", "Savusavu", "Korovou", "Vatukoula", "Navua", "Pacific Harbour", "Lami", "Deuba", "Naceva", "Nabua"],
    "Fildişi Sahili": ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo", "Man", "Divo", "Gagnoa", "Anyama", "Abengourou", "Grand-Bassam", "Dabou", "Agboville", "Bondoukou", "Oumé", "Ferkessédougou", "Séguéla", "Soubré", "Duékoué"],
    # G harfi ile başlayan ülkeler (eksikler)
    "Gabon": ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Mouila", "Lambaréné", "Tchibanga", "Koulamoutou", "Makokou", "Bitam", "Gamba", "Mékambo", "Ntoum", "Lastoursville", "Omboué", "Mayumba", "Mitzic", "Ndendé", "Booué"],
    "Gambiya": ["Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni", "Lamin", "Sukuta", "Gunjur", "Basse Santa Su", "Bansang", "Soma", "Essau", "Kerewan", "Georgetown", "Abuko", "Brufut", "Somita", "Gunjur Koto", "Wellingara", "Yundum"],
    "Gana": ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Ashaiman", "Sunyani", "Cape Coast", "Obuasi", "Teshie", "Tema", "Madina", "Koforidua", "Wa", "Techiman", "Ho", "Nungua", "Taifa", "Bolgatanga", "Bawku", "Aflao"],
    "Grenada": ["St. George's", "Gouyave", "Grenville", "Victoria", "Saint David's", "Sauteurs", "Hillsborough", "Woburn", "Grand Roy", "Hermitage", "Tivoli", "Saint Mark", "Birch Grove", "Marli", "Pearls", "Soubise", "Munich", "Grand Anse", "Beaulieu", "Belmont"],
    "Guatemala": ["Guatemala City", "Mixco", "Villa Nueva", "Petapa", "San Juan Sacatepéquez", "Quetzaltenango", "Villa Canales", "Escuintla", "Chinautla", "Chimaltenango", "Huehuetenango", "Amatitlán", "Totonicapán", "Santa Lucía Cotzumalguapa", "Coatepeque", "Santa Catarina Pinula", "Chichicastenango", "Jalapa", "Cobán", "Puerto Barrios"],
    "Gine": ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Guéckédou", "Macenta", "Kissidougou", "Mamou", "Siguiri", "Boké", "Dubréka", "Faranah", "Kamsar", "Forecariah", "Coyah", "Pita", "Fria", "Télimélé", "Dabola"],
    "Gine-Bissau": ["Bissau", "Bafatá", "Gabú", "Bissorã", "Bolama", "Cacheu", "Bubaque", "Catió", "Mansôa", "Buba", "Quebo", "Farim", "Canchungo", "São Domingos", "Quinhámel", "Fulacunda", "Contuboel", "Bambadinca", "Pitche", "Bigene"],
    "Guyana": ["Georgetown", "Linden", "New Amsterdam", "Anna Regina", "Bartica", "Skeldon", "Rosignol", "Mahaica", "Vreed-en-Hoop", "Parika", "Charity", "Corriverton", "Lethem", "Mabaruma", "Mahdia", "Paradise", "Diamond", "Eccles", "Good Hope", "Uitvlugt"],
    "Güney Sudan": ["Juba", "Malakal", "Wau", "Yei", "Yambio", "Rumbek", "Bor", "Bentiu", "Aweil", "Kuajok", "Torit", "Maridi", "Nimule", "Tonj", "Kapoeta", "Pibor", "Gogrial", "Akobo", "Mundri", "Renk"],
    # H harfi ile başlayan ülkeler (eksikler)
    "Haiti": ["Port-au-Prince", "Carrefour", "Delmas", "Cap-Haïtien", "Pétionville", "Gonaïves", "Saint-Marc", "Les Cayes", "Verrettes", "Port-de-Paix", "Jacmel", "Jérémie", "Fort-Liberté", "Miragoâne", "Petit-Goâve", "Hinche", "Limbé", "Trou du Nord", "Ouanaminthe", "Thomazeau"],
    "Hırvatistan": ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Slavonski Brod", "Karlovac", "Varaždin", "Šibenik", "Sisak", "Velika Gorica", "Dubrovnik", "Bjelovar", "Koprivnica", "Vinkovci", "Požega", "Vukovar", "Čakovec", "Samobor"],
    "Honduras": ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso", "Choluteca", "Comayagua", "Puerto Cortés", "La Lima", "Danlí", "Siguatepeque", "Juticalpa", "Tocoa", "Villanueva", "Tela", "Olanchito", "Santa Rosa de Copán", "Catacamas", "La Paz", "Potrerillos"],
    # I harfi ile başlayan ülkeler (eksikler)
    "Irak": ["Bağdat", "Basra", "Musul", "Erbil", "Kerkük", "Necef", "Nasıriye", "Süleymaniye", "Kerbela", "Ramadi", "Dohuk", "Amarah", "Hillah", "Kut", "Samarra", "Baqubah", "Tikrit", "Fallujah", "Zakho", "Sinjar"],
    "İran": ["Tahran", "Meşhed", "İsfahan", "Karaj", "Tebriz", "Şiraz", "Ahvaz", "Kum", "Kirmanşah", "Urmiye", "Reşt", "Zehdan", "Hemedan", "Kirman", "Arak", "Erdebil", "Yezd", "Bandar Abbas", "Esfahan", "Eslamshahr"],
    "İzlanda": ["Reykjavik", "Kópavogur", "Hafnarfjörður", "Akureyri", "Reykjanesbær", "Garðabær", "Mosfellsbær", "Árborg", "Akranes", "Fjarðabyggð", "Ísafjörður", "Vestmannaeyjar", "Grindavík", "Hveragerði", "Selfoss", "Sauðárkrókur", "Dalvík", "Neskaupstaður", "Húsavík", "Bolungarvík"],
    # İ harfi ile başlayan ülkeler (mevcut: İran, İrlanda, İsrail, İsveç, İsviçre, İspanya, İtalya, İzlanda zaten var)
    # J harfi ile başlayan ülkeler (eksikler)
    "Jamaika": ["Kingston", "Spanish Town", "Portmore", "Montego Bay", "May Pen", "Mandeville", "Old Harbour", "Savanna-la-Mar", "Port Antonio", "Linstead", "Half Way Tree", "Ocho Rios", "Morant Bay", "Santa Cruz", "Black River", "Bog Walk", "Brown's Town", "Falmouth", "Lucea", "Port Maria"],
    # K harfi ile başlayan ülkeler (eksikler)
    "Kıbrıs": ["Lefkoşa", "Limasol", "Larnaka", "Girne", "Gazimağusa", "Baf", "Güzelyurt", "Lefka", "İskele", "Akdoğan", "Ergazi", "Değirmenlik", "Pile", "Astromeritis", "Polis", "Yenierenköy", "Morfu", "Değirmenlik", "Boğaz", "Yialousa"],
    "Kırgızistan": ["Bişkek", "Oş", "Calal-Abad", "Karakol", "Tokmok", "Kara-Balta", "Naryn", "Talas", "Batken", "Kant", "Kemin", "Kyzyl-Kiya", "Tash-Kumyr", "Cholpon-Ata", "Balykchy", "Kochkor", "At-Bashi", "Uzgen", "Mailuu-Suu", "Isfana"],
    "Kiribati": ["South Tarawa", "Betio", "Bikenibeu", "Bairiki", "Teaoraereke", "Bonriki", "Eita", "Tabwakea", "Temaiku", "Ambo", "London", "Taborio", "Buota", "Banraeaba", "Tanaea", "Washington", "Utiroa", "Banana", "Koinawa", "Nawerewere"],
    "Komorlar": ["Moroni", "Mutsamudu", "Fomboni", "Domoni", "Tsimbeo", "Sima", "Ouani", "Mramani", "Bambao", "Mitsamiouli", "Foumbouni", "Iconi", "Wanani", "Mitsoudje", "Mbeni", "Dembeni", "Chironkamba", "Mirontsy", "Chandra", "Adda-Douéni"],
    "Kongo Cumhuriyeti": ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Owando", "Ouesso", "Madingou", "Gamboma", "Impfondo", "Sibiti", "Kinkala", "Mossendjo", "Makoua", "Djambala", "Ewo", "Loandjili", "Kayes", "Zanaga", "Loudima", "Boundji"],
    "Kongo Demokratik Cumhuriyeti": ["Kinşasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Kananga", "Likasi", "Kolwezi", "Tshikapa", "Bukavu", "Kikwit", "Mbandaka", "Matadi", "Uvira", "Butembo", "Gandajika", "Kalemie", "Goma", "Kindu", "Isiro", "Bandundu"],
    "Kosta Rika": ["San José", "Limón", "San Francisco", "Alajuela", "Liberia", "Paraíso", "Puntarenas", "Curridabat", "San Vicente", "San Isidro", "Desamparados", "San Carlos", "Cartago", "Nicoya", "Heredia", "Grecia", "Turrialba", "Pérez Zeledón", "Goicoechea", "Palmares"],
    "Kuveyt": ["Kuveyt City", "Hawalli", "Salmiya", "Sabah Al Salem", "Al Farwaniyah", "Al Ahmadi", "Al Jahra", "Ar Riqqah", "Al Fintas", "Salwa", "Abraq Khaitan", "Al Manqaf", "Kaifan", "Ar Rābiyah", "Janub as Surrah", "Sabah an Nasser", "Shuwaikh", "Bayan", "Mishref", "Fahaheel"],
    "Kuzey Kore": ["Pyongyang", "Hamhung", "Chongjin", "Nampo", "Wonsan", "Sinuiju", "Tanchon", "Kaechon", "Kaesong", "Sariwon", "Sunchon", "Pyongsong", "Haeju", "Kanggye", "Anju", "Tokchon", "Kimchaek", "Rason", "Songnim", "Kusong"],
    "Kuzey Makedonya": ["Üsküp", "Kumanova", "Bitola", "Tetova", "Gostivar", "Ohri", "Veles", "Prilep", "Strumica", "Kavadarci", "Kocani", "Struga", "Gevgelija", "Radoviš", "Debar", "Kičevo", "Sveti Nikole", "Negotino", "Berovo", "Valandovo"],
    # L harfi ile başlayan ülkeler (eksikler)
    "Laos": ["Vientiane", "Pakse", "Thakhek", "Savannakhet", "Luang Prabang", "Xam Neua", "Phonsavan", "Xaignabouli", "Salavan", "Pakxan", "Attapeu", "Muang Xay", "Phongsaly", "Houayxay", "Vangviang", "Louangnamtha", "Saravan", "Sekong", "Xepon", "Kaysone Phomvihane"],
    "Lesotho": ["Maseru", "Mafeteng", "Leribe", "Maputsoe", "Mohale's Hoek", "Qacha's Nek", "Quthing", "Butha-Buthe", "Mokhotlong", "Thaba-Tseka", "Teyateyaneng", "Peka", "Mapoteng", "Matsieng", "Semonkong", "Sehonghong", "Thaba-Phatsoa", "Hlotse", "Marakabei", "Roma"],
    "Letonya": ["Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne", "Valmiera", "Jēkabpils", "Ogre", "Tukums", "Cēsis", "Salaspils", "Kuldīga", "Olaine", "Saldus", "Talsi", "Sigulda", "Dobele", "Bauska"],
    "Liberya": ["Monrovia", "Gbarnga", "Kakata", "Bensonville", "Harper", "Voinjama", "Buchanan", "Zwedru", "New Yekepa", "Ganta", "Sanniquellie", "Pleebo", "Tubmanburg", "Greenville", "Robertsport", "River Cess", "Bopolu", "Fish Town", "Cestos City", "Barclayville"],
    "Libya": ["Trablus", "Bingazi", "Misrata", "Tobruk", "Zawiya", "Bayda", "Zuwara", "Ejdabiya", "Sirte", "Sebha", "Zliten", "Derna", "Gharyan", "Murzuq", "Khoms", "Marj", "Sabratha", "Ajdabiya", "Nalut", "Ghat"],
    "Lihtenştayn": ["Vaduz", "Schaan", "Balzers", "Triesen", "Eschen", "Mauren", "Triesenberg", "Ruggell", "Gamprin", "Schellenberg", "Planken", "Nendeln", "Schaanwald", "Malbun", "Steg", "Mühleholz", "Schaan-Mühleholz", "Bendern", "Nendeln", "Ebenholz"],
    "Litvanya": ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai", "Jonava", "Utena", "Kėdainiai", "Telšiai", "Tauragė", "Ukmergė", "Visaginas", "Plungė", "Kretinga", "Šilutė", "Radviliškis", "Palanga"],
    "Lüksemburg": ["Lüksemburg", "Esch-sur-Alzette", "Dudelange", "Schifflange", "Bettembourg", "Pétange", "Ettelbruck", "Diekirch", "Strassen", "Bertrange", "Sanem", "Hesperange", "Differdange", "Mamer", "Wiltz", "Echternach", "Rumelange", "Grevenmacher", "Remich", "Vianden"],
    # M harfi ile başlayan ülkeler (eksikler)
    "Madagaskar": ["Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga", "Toliara", "Antsiranana", "Ambovombe", "Antanifotsy", "Manakara", "Sambava", "Morondava", "Nosy Be", "Ambatolampy", "Antalaha", "Maroantsetra", "Fort Dauphin", "Farafangana", "Mananjary", "Amparafaravola"],
    "Malavi": ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Mangochi", "Kasungu", "Karonga", "Salima", "Liwonde", "Mulanje", "Nkhotakota", "Dedza", "Mchinji", "Balaka", "Rumphi", "Ntcheu", "Thyolo", "Mwanza", "Chitipa", "Nkhata Bay"],
    "Maldivler": ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo", "Naifaru", "Dhidhdhoo", "Maafushi", "Thulusdhoo", "Hulhumalé", "Vilimalé", "Mahibadhoo", "Eydhafushi", "Veymandoo", "Fonadhoo", "Muli", "Nolhivaram", "Nilandhoo", "Kudahuvadhoo", "Hithadhoo"],
    "Mali": ["Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes", "Ségou", "Gao", "Kati", "Koulikoro", "Tombouctou", "San", "Niono", "Bougouni", "Djenné", "Banamba", "Markala", "Koro", "Kolokani", "Yorosso", "Bla"],
    "Malta": ["Valletta", "Birkirkara", "Mosta", "St. Paul's Bay", "Qormi", "Żabbar", "Sliema", "Naxxar", "San Ġwann", "Fgura", "Żejtun", "Ħamrun", "Mellieħa", "Marsaskala", "Rabat", "Attard", "Swieqi", "Paola", "Tarxien", "Marsa"],
    "Marshall Adaları": ["Majuro", "Ebeye", "Laura", "Delap-Uliga-Djarrit", "Jabor", "Wotje", "Mili", "Arno", "Jaluit", "Likiep", "Wotho", "Ujae", "Lae", "Ailuk", "Mejit", "Namdrik", "Namu", "Lib", "Erikub", "Jemo"],
    "Mikronezya": ["Palikir", "Weno", "Kolonia", "Tol", "Colonia", "Sokehs", "Pohnpei", "Nett", "Uh", "Kitti", "Madolenihmw", "Mokil", "Pingelap", "Nukuoro", "Kapingamarangi", "Sapwuahfik", "Mwoakilloa", "Ant Atoll", "Pakin Atoll", "Oroluk"],
    "Moldova": ["Chișinău", "Tiraspol", "Bălți", "Bender", "Rîbnița", "Cahul", "Ungheni", "Soroca", "Orhei", "Comrat", "Ceadîr-Lunga", "Strășeni", "Dubăsari", "Edineț", "Căușeni", "Drochia", "Hîncești", "Vulcănești", "Florești", "Ștefan Vodă"],
    "Monako": ["Monaco", "Monte Carlo", "La Condamine", "Fontvieille", "Moneghetti", "Saint-Roman", "La Rousse", "Larvotto", "Les Révoires", "La Colle", "Saint-Michel", "Jardin Exotique", "Carré d'Or", "Port Hercule", "Grimaldi Forum", "Le Portier", "Les Moneghetti", "Sainte-Dévote", "Beausoleil", "Cap-d'Ail"],
    "Moğolistan": ["Ulan Batur", "Erdenet", "Darkhan", "Choibalsan", "Mörön", "Khovd", "Ölgii", "Tsetserleg", "Bayankhongor", "Ulaangom", "Arvaikheer", "Baruun-Urt", "Bulgan", "Altai", "Dalanzadgad", "Mandalgovi", "Sükhbaatar", "Züünkharaa", "Choir", "Saynshand"],
    "Moritanya": ["Nouakchott", "Nouadhibou", "Nema", "Kaédi", "Rosso", "Kiffa", "Zouérat", "Atar", "Sélibaby", "Akjoujt", "Tidjikja", "Ayoûn el Atroûs", "Aleg", "Bogué", "Mbout", "Boutilimit", "Bir Mogrein", "Kankossa", "Moudjéria", "Chinguetti"],
    "Mauritius": ["Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes", "Triolet", "Goodlands", "Centre de Flacq", "Mahebourg", "Saint Pierre", "Bambous", "Le Hochet", "Terre Rouge", "Rivière du Rempart", "Chemin Grenier", "Grand Baie", "Bel Air", "Tamarin", "Pamplemousses", "Souillac"],
    "Mozambik": ["Maputo", "Matola", "Nampula", "Beira", "Chimoio", "Tete", "Quelimane", "Lichinga", "Pemba", "Xai-Xai", "Maxixe", "Inhambane", "Cuamba", "Angoche", "Montepuez", "Dondo", "Mocuba", "Gurúè", "Nacala", "Manhiça"],
    "Myanmar": ["Yangon", "Mandalay", "Naypyidaw", "Mawlamyine", "Bago", "Pathein", "Monywa", "Meiktila", "Taunggyi", "Myeik", "Sittwe", "Dawei", "Pyay", "Hpa-An", "Myitkyina", "Lashio", "Magway", "Pakokku", "Hinthada", "Loikaw"],
    # N harfi ile başlayan ülkeler (eksikler)
    "Namibya": ["Windhoek", "Rundu", "Walvis Bay", "Oshakati", "Swakopmund", "Katima Mulilo", "Grootfontein", "Rehoboth", "Otjiwarongo", "Ondangwa", "Okahandja", "Keetmanshoop", "Tsumeb", "Gobabis", "Mariental", "Lüderitz", "Outapi", "Oranjemund", "Ongwediva", "Oshikango"],
    "Nauru": ["Yaren", "Denigomodu", "Nibok", "Aiwo", "Anabar", "Anibare", "Baiti", "Boe", "Buada", "Ewa", "Ijuw", "Meneng", "Uaboe", "Yaren District", "Arijejen", "Topside", "Command Ridge", "Location", "Civic Center", "Anibare Bay"],
    "Nepal": ["Katmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj", "Dharan", "Butwal", "Hetauda", "Janakpur", "Nepalgunj", "Dhangadhi", "Tulsipur", "Itahari", "Bhimdatta", "Gulariya", "Tansen", "Damak", "Triyuga", "Putalibazar"],
    "Nikaragua": ["Managua", "León", "Masaya", "Matagalpa", "Chinandega", "Estelí", "Tipitapa", "Granada", "Jinotega", "Ciudad Sandino", "Juigalpa", "Bluefields", "Nueva Guinea", "Ocotal", "Rivas", "Boaco", "Somoto", "San Carlos", "Jalapa", "Puerto Cabezas"],
    "Nijer": ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso", "Arlit", "Birni N Konni", "Tillabéri", "Diffa", "Téra", "Madaoua", "Tessaoua", "Dogondoutchi", "Ayorou", "Nguigmi", "Magaria", "Tanout", "Gaya", "Dakoro"],
    # P harfi ile başlayan ülkeler (eksikler)
    "Palau": ["Ngerulmud", "Koror", "Melekeok", "Airai", "Ngardmau", "Ngarchelong", "Ngatpang", "Ngeremlengui", "Ngiwal", "Peleliu", "Angaur", "Sonsorol", "Hatohobei", "Kayangel", "Ngchesar", "Aimeliik", "Ngaraard", "Ngchesar District", "Ollei", "Kloulklubed"],
    "Panama": ["Panama City", "San Miguelito", "Tocumen", "David", "Arraiján", "Colón", "La Chorrera", "Pacora", "Santiago", "Chitré", "Chilibre", "Las Cumbres", "Penonomé", "La Concepción", "Aguadulce", "Ancón", "Veraguas", "Bocas del Toro", "Balboa", "Pedregal"],
    "Papua Yeni Gine": ["Port Moresby", "Lae", "Arawa", "Mount Hagen", "Popondetta", "Madang", "Kokopo", "Mendi", "Kimbe", "Goroka", "Wewak", "Kundiawa", "Daru", "Alotau", "Kavieng", "Wabag", "Kerema", "Vanimo", "Rabaul", "Lorengau"],
    "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Capiatá", "Lambaré", "Fernando de la Mora", "Limpio", "Ñemby", "Encarnación", "Mariano Roque Alonso", "Pedro Juan Caballero", "Coronel Oviedo", "Itauguá", "Villa Elisa", "Caaguazú", "Villarrica", "Concepción", "San Antonio", "Presidente Franco"],
    "Filistin": ["Gazze", "Kudüs", "Nablus", "Hebron", "Ramallah", "Beytüllahim", "Cenin", "Ariha", "Tulkarm", "Kalkilya", "Rafah", "Khan Yunis", "Deir el-Balah", "Beit Lahia", "Beit Hanoun", "Yatta", "Jabalia", "Al-Bireh", "Halhul", "Dura"],
    # R harfi ile başlayan ülkeler (eksikler)
    "Ruanda": ["Kigali", "Butare", "Gitarama", "Ruhengeri", "Gisenyi", "Byumba", "Cyangugu", "Kibuye", "Kibungo", "Rwamagana", "Nyanza", "Muhanga", "Musanze", "Rubavu", "Huye", "Rusizi", "Nyagatare", "Karongi", "Bugesera", "Ngoma"],
    # S harfi ile başlayan ülkeler (eksikler)
    "Samoa": ["Apia", "Vaitele", "Faleula", "Siusega", "Malie", "Vaiusu", "Fasitoouta", "Nofoalii", "Safotulafai", "Fagamalo", "Leulumoega", "Mulifanua", "Salelologa", "Satupa'itea", "Falealupo", "Asau", "Saleaula", "Safotu", "Palauli", "Neiafu"],
    "San Marino": ["San Marino", "Serravalle", "Borgo Maggiore", "Domagnano", "Fiorentino", "Acquaviva", "Faetano", "Chiesanuova", "Montegiardino", "Dogana", "Rovereta", "Falciano", "Valdragone", "Cà Berlone", "Cailungo", "Torraccia", "Fiorina", "Ca' Giannino", "Montecchio", "Poggio di Chiesanuova"],
    "São Tomé ve Príncipe": ["São Tomé", "Trindade", "Neves", "Santana", "Santo António", "Guadalupe", "Angolares", "Porto Alegre", "Ribeira Afonso", "Santa Cruz", "São João dos Angolares", "Pantufo", "Santo Amaro", "Conde", "Madalena", "Bombom", "Caué", "Lembá", "Lobata", "Água Grande"],
    "Senegal": ["Dakar", "Pikine", "Touba", "Thiès", "Kaolack", "Saint-Louis", "Mbour", "Ziguinchor", "Rufisque", "Kolda", "Louga", "Diourbel", "Tambacounda", "Richard-Toll", "Tivaouane", "Sédhiou", "Matam", "Kédougou", "Linguère", "Fatick"],
    "Seyşeller": ["Victoria", "Anse Boileau", "Beau Vallon", "Takamaka", "Cascade", "Anse Royale", "Anse aux Pins", "Grand Anse Mahé", "Port Glaud", "Bel Ombre", "Baie Lazare", "La Digue", "Praslin", "Glacis", "Pointe Larue", "Mahe", "English River", "Mont Fleuri", "Roche Caiman", "Les Mamelles"],
    "Sierra Leone": ["Freetown", "Bo", "Kenema", "Koidu", "Makeni", "Lunsar", "Port Loko", "Waterloo", "Kabala", "Kailahun", "Magburaka", "Bonthe", "Moyamba", "Kambia", "Pujehun", "Yengema", "Pepel", "Masiaka", "Segbwema", "Kono"],
    "Slovakya": ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Martin", "Trenčín", "Poprad", "Prievidza", "Zvolen", "Považská Bystrica", "Michalovce", "Nové Zámky", "Komárno", "Levice", "Spišská Nová Ves", "Bardejov", "Liptovský Mikuláš"],
    "Slovenya": ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik", "Jesenice", "Nova Gorica", "Domžale", "Škofja Loka", "Murska Sobota", "Slovenj Gradec", "Izola", "Piran", "Ajdovščina", "Litija"],
    "Solomon Adaları": ["Honiara", "Gizo", "Auki", "Kirakira", "Buala", "Tulagi", "Lata", "Taro", "Munda", "Noro", "Tigoa", "Yandina", "Mbambanakira", "Malu'u", "Hunda", "Hatanga", "Viru Harbour", "Tingoa", "Sasamunga", "Tataba"],
    "Somali": ["Mogadişu", "Hargeisa", "Berbera", "Kismayo", "Marka", "Jamame", "Borama", "Baidoa", "Burao", "Bosaso", "Galkayo", "Beledweyne", "Garowe", "Erigavo", "Bardera", "Luuq", "Jowhar", "Afgoye", "Wanlaweyn", "Bossaso"],
    "Sri Lanka": ["Kolombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Negombo", "Kandy", "Jaffna", "Kalmunai", "Trincomalee", "Galle", "Batticaloa", "Matara", "Vavuniya", "Anuradhapura", "Kurunegala", "Ratnapura", "Badulla", "Matale", "Nuwara Eliya", "Puttalam", "Ampara"],
    "Sudan": ["Hartum", "Omdurman", "Port Sudan", "Nyala", "Kassala", "El Obeid", "Kosti", "Wad Madani", "El Fasher", "El Geneina", "Dongola", "El Damazin", "Atbara", "Ed Dueim", "Kadugli", "Sennar", "Gedaref", "Ad-Damazin", "Wau", "Kuraymah"],
    "Surinam": ["Paramaribo", "Lelydorp", "Nieuw Nickerie", "Moengo", "Nieuw Amsterdam", "Mariënburg", "Wageningen", "Albina", "Groningen", "Brownsweg", "Totness", "Onverwacht", "Meerzorg", "Brokopondo", "Commewijne", "Tamanredjo", "Coronie", "Saramacca", "Marowijne", "Sipaliwini"],
    # Ş harfi zaten var (Şili)
    # T harfi ile başlayan ülkeler (eksikler)
    "Tacikistan": ["Duşanbe", "Khujand", "Kulob", "Qurghonteppa", "Khorugh", "Istaravshan", "Tursunzoda", "Panjakent", "Hisor", "Vahdat", "Isfara", "Konibodom", "Yovon", "Vose", "Rogun", "Norak", "Danghara", "Somoniyon", "Ghafurov", "Rudaki"],
    "Tanzanya": ["Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Mbeya", "Morogoro", "Tanga", "Kahama", "Tabora", "Zanzibar City", "Kigoma", "Sumbawanga", "Kasulu", "Songea", "Moshi", "Musoma", "Shinyanga", "Iringa", "Singida", "Njombe"],
    "Togo": ["Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé", "Bassar", "Tsévié", "Aného", "Sansanné-Mango", "Dapaong", "Tchamba", "Niamtougou", "Vogan", "Badou", "Tabligbo", "Notsé", "Kandé", "Bafilo", "Sotouboua", "Amlamé"],
    "Tonga": ["Nuku'alofa", "Neiafu", "Haveluloto", "Vaini", "Pangai", "'Ohonua", "Hihifo", "Kolonga", "Mu'a", "Talafo'ou", "Hoi", "Holonga", "Kolofo'ou", "Ha'ateiho", "Havelu", "Fua'amotu", "Pea", "Tatakamotonga", "Pelehake", "Nukunuku"],
    "Trinidad ve Tobago": ["Port of Spain", "Chaguanas", "San Fernando", "Arima", "Marabella", "Point Fortin", "Couva", "Princes Town", "Sangre Grande", "Tunapuna", "Diego Martin", "Penal", "Debe", "Siparia", "Rio Claro", "Scarborough", "Arouca", "Gasparillo", "Cunupia", "San Juan"],
    "Tunus": ["Tunus", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa", "La Marsa", "Monastir", "Ben Arous", "Kasserine", "Nabeul", "Menzel Bourguiba", "Béja", "Medenine", "Tozeur", "Jendouba", "Tataouine", "Mahdia"],
    "Türkmenistan": ["Aşkabat", "Türkmenabat", "Daşoguz", "Mary", "Balkanabat", "Türkmenbaşy", "Tejen", "Serdar", "Abadan", "Gökdepe", "Baharly", "Saýat", "Magdanly", "Gowurdak", "Köneürgench", "Gumdag", "Gazojak", "Baýramaly", "Kerki", "Farap"],
    "Tuvalu": ["Funafuti", "Vaiaku", "Alapi", "Tanrake", "Toga", "Asau", "Savave", "Vaitupu", "Nanumea", "Nanumaga", "Niutao", "Nui", "Niulakita", "Nukufetau", "Nukulaelae", "Fongafale", "Teava", "Senala", "Lolua", "Motulalo"],
    # Eksik ülkeler - kullanıcı isteği
    "Fas": ["Rabat", "Kazablanka", "Fes", "Tanca", "Marakeş", "Sale", "Meknes", "Oujda", "Kenitra", "Agadir", "Tetouan", "Temara", "Safi", "Mohammedia", "Khouribga", "El Jadida", "Beni Mellal", "Nador", "Taza", "Settat"],
    "Kamboçya": ["Phnom Penh", "Takéo", "Siem Reap", "Battambang", "Sihanoukville", "Poi Pet", "Kampong Cham", "Ta Khmau", "Pursat", "Kampong Speu", "Kampong Chhnang", "Prey Veng", "Svay Rieng", "Kratie", "Stung Treng", "Kampot", "Koh Kong", "Pailin", "Banlung", "Senmonorom"],
    "Kamerun": ["Douala", "Yaoundé", "Garoua", "Bamenda", "Bafoussam", "Maroua", "Nkongsamba", "Ngaoundéré", "Bertoua", "Kumba", "Edéa", "Foumban", "Limbe", "Buea", "Ebolowa", "Kribi", "Kumbo", "Mbalmayo", "Mbouda", "Dschang"],
    "Karadağ": ["Podgorica", "Nikšić", "Pljevlja", "Bijelo Polje", "Cetinje", "Bar", "Herceg Novi", "Berane", "Budva", "Ulcinj", "Tivat", "Rožaje", "Kotor", "Danilovgrad", "Mojkovac", "Plav", "Kolašin", "Andrijevica", "Plužine", "Šavnik"],
    "Küba": ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Guantánamo", "Las Tunas", "Bayamo", "Cienfuegos", "Pinar del Río", "Matanzas", "Ciego de Ávila", "Sancti Spíritus", "Manzanillo", "Cárdenas", "Palma Soriano", "Artemisa", "Moa", "Contramaestre", "Güines"],
    "Lübnan": ["Beyrut", "Trablus", "Sayda", "Tire", "Nabatiye", "Zahle", "Baalbek", "Jounieh", "Byblos", "Aley", "Baabda", "Halba", "Jezzine", "Batrun", "Bint Jbeil", "Marjeyoun", "Rachaya", "Hasbaiya", "Bikfaya", "Amioun"],
    "Orta Afrika Cumhuriyeti": ["Bangui", "Bimbo", "Berbérati", "Carnot", "Bambari", "Bouar", "Bossangoa", "Bria", "Bangassou", "Nola", "Kaga-Bandoro", "Zemio", "Mobaye", "Gamboula", "Paoua", "Sibut", "Bozoum", "Batangafo", "Obo", "Rafaï"],
    "Suriye": ["Şam", "Halep", "Humus", "Lazkiye", "Hama", "Rakka", "Deir ez-Zor", "Haseke", "Kamışlı", "Tartus", "Daraa", "İdlib", "Cebele", "Sweida", "Münbiç", "Afrin", "Azaz", "Jarablus", "Tel Abyad", "Kobani"],
    "Finlandiya": ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hämeenlinna", "Vaasa", "Seinäjoki", "Rovaniemi", "Mikkeli", "Kotka", "Salo"],
    "Gürcistan": ["Tiflis", "Kutaisi", "Batumi", "Rustavi", "Zugdidi", "Gori", "Poti", "Khashuri", "Samtredia", "Senaki", "Zestafoni", "Marneuli", "Telavi", "Akhaltsikhe", "Kobuleti", "Ozurgeti", "Kaspi", "Chiatura", "Tskaltubo", "Sagarejo"]
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
