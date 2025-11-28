"""
Seed Module Templates for Proposal System
Creates default system templates for all module types
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'crm_db')]

# Module templates data
TEMPLATES = [
    # ===================== COVER PAGE TEMPLATES =====================
    {
        "module_type": "cover_page",
        "template_name": "Modern Minimal",
        "description": "Sade ve şık tasarım, büyük logo alanı",
        "thumbnail_url": "/templates/cover_modern_minimal.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "modern_minimal",
            "default_text": {
                "tr": {
                    "title": "{{project_name}}",
                    "subtitle": "Teklif No: {{proposal_number}}",
                    "date_label": "Tarih",
                    "prepared_for": "Hazırlanan Firma",
                    "prepared_by": "Hazırlayan"
                },
                "en": {
                    "title": "{{project_name}}",
                    "subtitle": "Proposal No: {{proposal_number}}",
                    "date_label": "Date",
                    "prepared_for": "Prepared For",
                    "prepared_by": "Prepared By"
                }
            },
            "placeholders": ["project_name", "proposal_number", "date", "customer_name", "company_name", "company_logo"],
            "styles": {}
        }
    },
    {
        "module_type": "cover_page",
        "template_name": "Kurumsal Klasik",
        "description": "Geleneksel kurumsal görünüm, detaylı bilgi alanları",
        "thumbnail_url": "/templates/cover_corporate.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "corporate_classic",
            "default_text": {
                "tr": {
                    "title": "TEKLİF",
                    "subtitle": "{{project_name}}",
                    "proposal_info": "Teklif No: {{proposal_number}}\nTarih: {{date}}\nGeçerlilik: {{validity_date}}",
                    "prepared_for": "Sayın {{customer_name}}",
                    "prepared_by": "{{company_name}}"
                },
                "en": {
                    "title": "PROPOSAL",
                    "subtitle": "{{project_name}}",
                    "proposal_info": "Proposal No: {{proposal_number}}\nDate: {{date}}\nValid Until: {{validity_date}}",
                    "prepared_for": "Dear {{customer_name}}",
                    "prepared_by": "{{company_name}}"
                }
            },
            "placeholders": ["project_name", "proposal_number", "date", "validity_date", "customer_name", "company_name", "company_logo"],
            "styles": {}
        }
    },
    {
        "module_type": "cover_page",
        "template_name": "Fuar Özel",
        "description": "Fuar projeleri için özel tasarım, etkinlik bilgileri ön planda",
        "thumbnail_url": "/templates/cover_fair.png",
        "is_system": True,
        "is_active": True,
        "display_order": 3,
        "content": {
            "layout": "fair_special",
            "default_text": {
                "tr": {
                    "title": "{{fair_name}}",
                    "subtitle": "Stand Tasarım ve Uygulama Teklifi",
                    "fair_info": "{{fair_venue}} | {{fair_city}}, {{fair_country}}\n{{start_date}} - {{end_date}}",
                    "stand_info": "Hall: {{hall_number}} | Stand: {{stand_number}} | Alan: {{stand_size}}",
                    "prepared_for": "{{customer_name}}"
                },
                "en": {
                    "title": "{{fair_name}}",
                    "subtitle": "Stand Design & Build Proposal",
                    "fair_info": "{{fair_venue}} | {{fair_city}}, {{fair_country}}\n{{start_date}} - {{end_date}}",
                    "stand_info": "Hall: {{hall_number}} | Stand: {{stand_number}} | Area: {{stand_size}}",
                    "prepared_for": "{{customer_name}}"
                }
            },
            "placeholders": ["fair_name", "fair_venue", "fair_city", "fair_country", "start_date", "end_date", "hall_number", "stand_number", "stand_size", "customer_name", "company_logo"],
            "styles": {}
        }
    },
    
    # ===================== INTRODUCTION TEMPLATES =====================
    {
        "module_type": "introduction",
        "template_name": "Profesyonel Giriş",
        "description": "Resmi ve profesyonel ton",
        "thumbnail_url": "/templates/intro_professional.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "standard",
            "default_text": {
                "tr": {
                    "title": "Değerli İş Ortağımız",
                    "body": "Sayın {{contact_person}},\n\n{{project_name}} projesi kapsamında tarafınıza sunduğumuz bu teklif, ihtiyaçlarınız doğrultusunda özenle hazırlanmıştır.\n\nFirmamız, sektördeki {{years_experience}} yılı aşkın deneyimi ve {{completed_projects}} başarıyla tamamlanmış projesiyle, sizin de beklentilerinizi en üst düzeyde karşılamayı hedeflemektedir.\n\nTeklif detaylarını incelemenizi ve sorularınız için bizimle iletişime geçmenizi rica ederiz.\n\nSaygılarımızla,\n{{company_name}}"
                },
                "en": {
                    "title": "Dear Business Partner",
                    "body": "Dear {{contact_person}},\n\nThis proposal for the {{project_name}} project has been carefully prepared in accordance with your requirements.\n\nWith over {{years_experience}} years of experience in the industry and {{completed_projects}} successfully completed projects, our company aims to meet your expectations at the highest level.\n\nWe kindly ask you to review the proposal details and contact us for any questions.\n\nBest regards,\n{{company_name}}"
                }
            },
            "placeholders": ["contact_person", "project_name", "years_experience", "completed_projects", "company_name"],
            "styles": {}
        }
    },
    {
        "module_type": "introduction",
        "template_name": "Samimi Yaklaşım",
        "description": "Daha sıcak ve samimi bir ton",
        "thumbnail_url": "/templates/intro_friendly.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "standard",
            "default_text": {
                "tr": {
                    "title": "Merhaba {{contact_person}}",
                    "body": "{{project_name}} projeniz için heyecan duyuyoruz!\n\nEkibimiz, vizyonunuzu gerçeğe dönüştürmek için sabırsızlanıyor. Bu teklifte, projenizi en iyi şekilde hayata geçirmek için neler yapabileceğimizi detaylı olarak bulacaksınız.\n\nSorularınız mı var? Her zaman bir telefon kadar yakınız.\n\nBirlikte harika işler çıkaracağımıza inanıyoruz!\n\n{{company_name}} Ekibi"
                },
                "en": {
                    "title": "Hello {{contact_person}}",
                    "body": "We are excited about your {{project_name}} project!\n\nOur team can't wait to turn your vision into reality. In this proposal, you will find details of what we can do to bring your project to life in the best possible way.\n\nHave questions? We're always just a phone call away.\n\nWe believe we will do great things together!\n\n{{company_name}} Team"
                }
            },
            "placeholders": ["contact_person", "project_name", "company_name"],
            "styles": {}
        }
    },
    
    # ===================== ABOUT COMPANY TEMPLATES =====================
    {
        "module_type": "about_company",
        "template_name": "Standart Firma Tanıtımı",
        "description": "Genel firma tanıtım şablonu",
        "thumbnail_url": "/templates/about_standard.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "standard",
            "default_text": {
                "tr": {
                    "title": "Hakkımızda",
                    "body": "{{company_name}}, {{founding_year}} yılından bu yana {{industry}} sektöründe faaliyet göstermektedir.\n\nMisyonumuz: [Misyon cümlenizi buraya yazın]\n\nVizyonumuz: [Vizyon cümlenizi buraya yazın]\n\nDeğerlerimiz:\n• Kalite\n• Güvenilirlik\n• Müşteri Memnuniyeti\n• Yenilikçilik"
                },
                "en": {
                    "title": "About Us",
                    "body": "{{company_name}} has been operating in the {{industry}} sector since {{founding_year}}.\n\nOur Mission: [Write your mission statement here]\n\nOur Vision: [Write your vision statement here]\n\nOur Values:\n• Quality\n• Reliability\n• Customer Satisfaction\n• Innovation"
                }
            },
            "placeholders": ["company_name", "founding_year", "industry"],
            "styles": {}
        }
    },
    {
        "module_type": "about_company",
        "template_name": "Hikaye Anlatımı",
        "description": "Firma hikayesini anlatan format",
        "thumbnail_url": "/templates/about_story.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "story",
            "default_text": {
                "tr": {
                    "title": "Hikayemiz",
                    "body": "Her şey {{founding_year}} yılında küçük bir atölyede başladı...\n\n[Firmanızın kuruluş hikayesini buraya yazın. Nasıl başladınız? İlk projeniz ne oldu? Hangi zorluklarla karşılaştınız ve nasıl aştınız?]\n\nBugün, {{team_size}} kişilik ekibimizle {{countries_served}} ülkede hizmet veriyoruz. Ama bir şey hiç değişmedi: Her projede ilk günkü heyecanı ve özeni taşıyoruz."
                },
                "en": {
                    "title": "Our Story",
                    "body": "It all started in a small workshop in {{founding_year}}...\n\n[Write your company's founding story here. How did you start? What was your first project? What challenges did you face and how did you overcome them?]\n\nToday, with our team of {{team_size}} people, we serve in {{countries_served}} countries. But one thing has never changed: we carry the same excitement and care from day one in every project."
                }
            },
            "placeholders": ["founding_year", "team_size", "countries_served"],
            "styles": {}
        }
    },
    
    # ===================== COMPANY STATISTICS TEMPLATES =====================
    {
        "module_type": "company_statistics",
        "template_name": "Rakamlarla Biz",
        "description": "Büyük rakamlarla etkileyici istatistikler",
        "thumbnail_url": "/templates/stats_numbers.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "big_numbers",
            "default_text": {
                "tr": {
                    "title": "Rakamlarla Biz",
                    "stats": [
                        {"label": "Yıllık Deneyim", "value": "{{years_experience}}", "suffix": "+"},
                        {"label": "Tamamlanan Proje", "value": "{{completed_projects}}", "suffix": "+"},
                        {"label": "Mutlu Müşteri", "value": "{{happy_customers}}", "suffix": "+"},
                        {"label": "Ülkede Hizmet", "value": "{{countries_served}}", "suffix": ""}
                    ]
                },
                "en": {
                    "title": "By The Numbers",
                    "stats": [
                        {"label": "Years of Experience", "value": "{{years_experience}}", "suffix": "+"},
                        {"label": "Completed Projects", "value": "{{completed_projects}}", "suffix": "+"},
                        {"label": "Happy Customers", "value": "{{happy_customers}}", "suffix": "+"},
                        {"label": "Countries Served", "value": "{{countries_served}}", "suffix": ""}
                    ]
                }
            },
            "placeholders": ["years_experience", "completed_projects", "happy_customers", "countries_served"],
            "styles": {}
        }
    },
    
    
    # ===================== INCLUDED SERVICES TEMPLATES =====================
    {
        "module_type": "included_services",
        "template_name": "Checklist Formatı",
        "description": "Tik işaretli liste formatı",
        "thumbnail_url": "/templates/services_checklist.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "checklist",
            "default_text": {
                "tr": {
                    "title": "Teklife Dahil Hizmetler",
                    "intro": "Aşağıdaki hizmetler teklif kapsamında sunulmaktadır:",
                    "items": [
                        "Konsept tasarım ve 3D görselleştirme",
                        "Teknik çizimler ve üretim planları",
                        "Malzeme temini ve üretim",
                        "Nakliye ve lojistik",
                        "Sahada montaj ve kurulum",
                        "Fuar süresince teknik destek",
                        "Söküm ve geri nakliye"
                    ]
                },
                "en": {
                    "title": "Services Included",
                    "intro": "The following services are included in this proposal:",
                    "items": [
                        "Concept design and 3D visualization",
                        "Technical drawings and production plans",
                        "Material procurement and production",
                        "Transportation and logistics",
                        "On-site assembly and installation",
                        "Technical support during the fair",
                        "Dismantling and return transport"
                    ]
                }
            },
            "placeholders": [],
            "styles": {}
        }
    },
    {
        "module_type": "included_services",
        "template_name": "Detaylı Açıklamalı",
        "description": "Her hizmetin açıklamasıyla birlikte",
        "thumbnail_url": "/templates/services_detailed.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "detailed",
            "default_text": {
                "tr": {
                    "title": "Dahil Olan Hizmetler",
                    "services": [
                        {"name": "Tasarım Hizmetleri", "description": "Konsept geliştirme, 3D modelleme, render görselleştirme ve revizyon çalışmaları"},
                        {"name": "Üretim", "description": "Tüm stand elemanlarının fabrikamızda üretimi, kalite kontrol ve paketleme"},
                        {"name": "Lojistik", "description": "Fuar alanına nakliye, gümrükleme işlemleri (uluslararası fuarlar için)"},
                        {"name": "Montaj", "description": "Profesyonel ekibimizle sahada kurulum, elektrik ve aydınlatma bağlantıları"},
                        {"name": "Destek", "description": "Fuar süresince 7/24 teknik destek hattı"}
                    ]
                },
                "en": {
                    "title": "Included Services",
                    "services": [
                        {"name": "Design Services", "description": "Concept development, 3D modeling, render visualization and revision work"},
                        {"name": "Production", "description": "Manufacturing of all stand elements in our factory, quality control and packaging"},
                        {"name": "Logistics", "description": "Transportation to the fair venue, customs procedures (for international fairs)"},
                        {"name": "Assembly", "description": "On-site installation with our professional team, electrical and lighting connections"},
                        {"name": "Support", "description": "24/7 technical support line during the fair"}
                    ]
                }
            },
            "placeholders": [],
            "styles": {}
        }
    },
    
    # ===================== EXCLUDED SERVICES TEMPLATES =====================
    {
        "module_type": "excluded_services",
        "template_name": "Standart Hariç Liste",
        "description": "Teklife dahil olmayan kalemlerin listesi",
        "thumbnail_url": "/templates/excluded_standard.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "list",
            "default_text": {
                "tr": {
                    "title": "Teklife Dahil Olmayan Kalemler",
                    "intro": "Aşağıdaki kalemler bu teklif kapsamı dışındadır:",
                    "items": [
                        "Fuar katılım ücreti ve stand kirası",
                        "Elektrik, su ve internet bağlantı ücretleri",
                        "Mobilya ve aksesuar kiralaması",
                        "Hostess ve promotör hizmetleri",
                        "Katalog, broşür ve tanıtım malzemeleri",
                        "Konaklama ve ulaşım giderleri",
                        "Sigorta masrafları"
                    ],
                    "note": "Yukarıdaki kalemler talep edilmesi halinde ayrıca fiyatlandırılabilir."
                },
                "en": {
                    "title": "Items Not Included",
                    "intro": "The following items are not included in this proposal:",
                    "items": [
                        "Fair participation fee and stand rental",
                        "Electricity, water and internet connection fees",
                        "Furniture and accessory rental",
                        "Hostess and promoter services",
                        "Catalogs, brochures and promotional materials",
                        "Accommodation and transportation expenses",
                        "Insurance costs"
                    ],
                    "note": "The above items can be quoted separately upon request."
                }
            },
            "placeholders": [],
            "styles": {}
        }
    },
    
    # ===================== REFERENCES TEMPLATES =====================
    {
        "module_type": "references",
        "template_name": "Logo Galeri",
        "description": "Müşteri logolarının grid görünümü",
        "thumbnail_url": "/templates/references_logos.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "logo_grid",
            "default_text": {
                "tr": {
                    "title": "Referanslarımız",
                    "subtitle": "Birlikte çalışmaktan gurur duyduğumuz markalar"
                },
                "en": {
                    "title": "Our References",
                    "subtitle": "Brands we are proud to work with"
                }
            },
            "placeholders": ["reference_logos"],
            "styles": {}
        }
    },
    {
        "module_type": "references",
        "template_name": "Detaylı Referanslar",
        "description": "Proje detaylarıyla birlikte referanslar",
        "thumbnail_url": "/templates/references_detailed.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "detailed",
            "default_text": {
                "tr": {
                    "title": "Seçilmiş Projelerimiz",
                    "references": [
                        {"client": "[Müşteri Adı]", "project": "[Proje/Fuar Adı]", "year": "[Yıl]", "description": "[Kısa proje açıklaması]"}
                    ]
                },
                "en": {
                    "title": "Selected Projects",
                    "references": [
                        {"client": "[Client Name]", "project": "[Project/Fair Name]", "year": "[Year]", "description": "[Brief project description]"}
                    ]
                }
            },
            "placeholders": [],
            "styles": {}
        }
    },
    
    # ===================== PORTFOLIO TEMPLATES =====================
    {
        "module_type": "portfolio",
        "template_name": "Galeri Görünümü",
        "description": "Büyük görsellerle proje galerisi",
        "thumbnail_url": "/templates/portfolio_gallery.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "gallery",
            "default_text": {
                "tr": {
                    "title": "Projelerimizden Örnekler",
                    "subtitle": "Benzer projelerimizden görüntüler"
                },
                "en": {
                    "title": "Project Examples",
                    "subtitle": "Images from our similar projects"
                }
            },
            "placeholders": ["portfolio_images"],
            "styles": {}
        }
    },
    
    # ===================== TIMELINE TEMPLATES =====================
    {
        "module_type": "timeline",
        "template_name": "Dikey Timeline",
        "description": "Aşamaları gösteren dikey zaman çizelgesi",
        "thumbnail_url": "/templates/timeline_vertical.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "vertical",
            "default_text": {
                "tr": {
                    "title": "Proje Takvimi",
                    "phases": [
                        {"phase": "Tasarım Onayı", "duration": "1-2 Hafta", "description": "Konsept tasarım, revizyonlar ve final onay"},
                        {"phase": "Üretim", "duration": "3-4 Hafta", "description": "Stand elemanlarının üretimi ve kalite kontrol"},
                        {"phase": "Nakliye", "duration": "1 Hafta", "description": "Fuar alanına sevkiyat"},
                        {"phase": "Montaj", "duration": "2-3 Gün", "description": "Sahada kurulum ve son kontroller"},
                        {"phase": "Fuar", "duration": "{{fair_duration}}", "description": "Etkinlik süresince destek"},
                        {"phase": "Söküm", "duration": "1 Gün", "description": "Stand sökümü ve geri nakliye"}
                    ]
                },
                "en": {
                    "title": "Project Timeline",
                    "phases": [
                        {"phase": "Design Approval", "duration": "1-2 Weeks", "description": "Concept design, revisions and final approval"},
                        {"phase": "Production", "duration": "3-4 Weeks", "description": "Manufacturing of stand elements and quality control"},
                        {"phase": "Shipping", "duration": "1 Week", "description": "Transportation to fair venue"},
                        {"phase": "Assembly", "duration": "2-3 Days", "description": "On-site installation and final checks"},
                        {"phase": "Fair", "duration": "{{fair_duration}}", "description": "Support during the event"},
                        {"phase": "Dismantling", "duration": "1 Day", "description": "Stand dismantling and return transport"}
                    ]
                }
            },
            "placeholders": ["fair_duration"],
            "styles": {}
        }
    },
    
    # ===================== TECHNICAL SPECS TEMPLATES =====================
    {
        "module_type": "technical_specs",
        "template_name": "Tablo Formatı",
        "description": "Teknik detayların tablo görünümü",
        "thumbnail_url": "/templates/specs_table.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "table",
            "default_text": {
                "tr": {
                    "title": "Teknik Şartname",
                    "sections": [
                        {
                            "name": "Stand Ölçüleri",
                            "specs": [
                                {"label": "Toplam Alan", "value": "{{stand_size}}"},
                                {"label": "Yükseklik", "value": "[Belirtiniz]"},
                                {"label": "Kat Sayısı", "value": "[Belirtiniz]"}
                            ]
                        },
                        {
                            "name": "Malzeme",
                            "specs": [
                                {"label": "Ana Konstrüksiyon", "value": "[Belirtiniz]"},
                                {"label": "Zemin Kaplama", "value": "[Belirtiniz]"},
                                {"label": "Duvar Panelleri", "value": "[Belirtiniz]"}
                            ]
                        },
                        {
                            "name": "Elektrik",
                            "specs": [
                                {"label": "Güç İhtiyacı", "value": "[Belirtiniz] kW"},
                                {"label": "Priz Sayısı", "value": "[Belirtiniz]"},
                                {"label": "Aydınlatma", "value": "[Belirtiniz]"}
                            ]
                        }
                    ]
                },
                "en": {
                    "title": "Technical Specifications",
                    "sections": [
                        {
                            "name": "Stand Dimensions",
                            "specs": [
                                {"label": "Total Area", "value": "{{stand_size}}"},
                                {"label": "Height", "value": "[Specify]"},
                                {"label": "Number of Floors", "value": "[Specify]"}
                            ]
                        },
                        {
                            "name": "Materials",
                            "specs": [
                                {"label": "Main Construction", "value": "[Specify]"},
                                {"label": "Floor Covering", "value": "[Specify]"},
                                {"label": "Wall Panels", "value": "[Specify]"}
                            ]
                        },
                        {
                            "name": "Electrical",
                            "specs": [
                                {"label": "Power Requirement", "value": "[Specify] kW"},
                                {"label": "Number of Outlets", "value": "[Specify]"},
                                {"label": "Lighting", "value": "[Specify]"}
                            ]
                        }
                    ]
                }
            },
            "placeholders": ["stand_size"],
            "styles": {}
        }
    },
    
    # ===================== PRICING TEMPLATES =====================
    {
        "module_type": "pricing",
        "template_name": "Detaylı Fiyat Tablosu",
        "description": "Kalem bazlı detaylı fiyatlandırma tablosu",
        "thumbnail_url": "/templates/pricing_detailed.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "detailed_table",
            "default_text": {
                "tr": {
                    "title": "Fiyat Teklifi",
                    "table_headers": ["Kalem", "Açıklama", "Miktar", "Birim", "Birim Fiyat", "Toplam"],
                    "subtotal_label": "Ara Toplam",
                    "discount_label": "İskonto",
                    "tax_label": "KDV (%{{tax_rate}})",
                    "total_label": "GENEL TOPLAM",
                    "currency_note": "Tüm fiyatlar {{currency}} cinsindendir.",
                    "validity_note": "Bu teklif {{validity_date}} tarihine kadar geçerlidir."
                },
                "en": {
                    "title": "Price Quotation",
                    "table_headers": ["Item", "Description", "Qty", "Unit", "Unit Price", "Total"],
                    "subtotal_label": "Subtotal",
                    "discount_label": "Discount",
                    "tax_label": "VAT ({{tax_rate}}%)",
                    "total_label": "GRAND TOTAL",
                    "currency_note": "All prices are in {{currency}}.",
                    "validity_note": "This proposal is valid until {{validity_date}}."
                }
            },
            "placeholders": ["currency", "tax_rate", "validity_date", "line_items"],
            "styles": {}
        }
    },
    {
        "module_type": "pricing",
        "template_name": "Özet Fiyat",
        "description": "Sadece toplam tutarı gösteren basit format",
        "thumbnail_url": "/templates/pricing_summary.png",
        "is_system": True,
        "is_active": True,
        "display_order": 2,
        "content": {
            "layout": "summary",
            "default_text": {
                "tr": {
                    "title": "Teklif Tutarı",
                    "total_label": "Toplam Yatırım",
                    "tax_note": "KDV dahil",
                    "validity_note": "Bu teklif {{validity_date}} tarihine kadar geçerlidir."
                },
                "en": {
                    "title": "Proposal Amount",
                    "total_label": "Total Investment",
                    "tax_note": "VAT included",
                    "validity_note": "This proposal is valid until {{validity_date}}."
                }
            },
            "placeholders": ["total", "currency", "validity_date"],
            "styles": {}
        }
    },
    
    # ===================== PAYMENT TERMS TEMPLATES =====================
    {
        "module_type": "payment_terms",
        "template_name": "Standart Ödeme Planı",
        "description": "Aşamalı ödeme planı",
        "thumbnail_url": "/templates/payment_staged.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "staged",
            "default_text": {
                "tr": {
                    "title": "Ödeme Koşulları",
                    "intro": "Ödeme aşağıdaki plan dahilinde gerçekleştirilecektir:",
                    "stages": [
                        {"percentage": "50%", "timing": "Sipariş onayında", "description": "Tasarım onayı ve üretim başlangıcı için"},
                        {"percentage": "30%", "timing": "Nakliye öncesi", "description": "Üretim tamamlandığında, sevkiyat öncesi"},
                        {"percentage": "20%", "timing": "Montaj sonrası", "description": "Stand kurulumu tamamlandığında"}
                    ],
                    "bank_info": {
                        "title": "Banka Bilgileri",
                        "bank_name": "[Banka Adı]",
                        "branch": "[Şube]",
                        "account_holder": "[Hesap Sahibi]",
                        "iban": "[IBAN]",
                        "swift": "[SWIFT Kodu]"
                    },
                    "notes": "Ödemeler banka havalesi ile yapılacaktır. Fatura, ödeme alındıktan sonra düzenlenecektir."
                },
                "en": {
                    "title": "Payment Terms",
                    "intro": "Payment will be made according to the following schedule:",
                    "stages": [
                        {"percentage": "50%", "timing": "Upon order confirmation", "description": "For design approval and production start"},
                        {"percentage": "30%", "timing": "Before shipping", "description": "Upon production completion, before dispatch"},
                        {"percentage": "20%", "timing": "After assembly", "description": "Upon completion of stand installation"}
                    ],
                    "bank_info": {
                        "title": "Bank Details",
                        "bank_name": "[Bank Name]",
                        "branch": "[Branch]",
                        "account_holder": "[Account Holder]",
                        "iban": "[IBAN]",
                        "swift": "[SWIFT Code]"
                    },
                    "notes": "Payments shall be made by bank transfer. Invoice will be issued upon receipt of payment."
                }
            },
            "placeholders": [],
            "styles": {}
        }
    },
    
    # ===================== WARRANTY TEMPLATES =====================
    {
        "module_type": "warranty",
        "template_name": "Standart Garanti",
        "description": "Garanti ve satış sonrası destek bilgileri",
        "thumbnail_url": "/templates/warranty_standard.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "standard",
            "default_text": {
                "tr": {
                    "title": "Garanti ve Satış Sonrası Destek",
                    "warranty_section": {
                        "title": "Garanti Kapsamı",
                        "content": "Üretim ve işçilik hatalarına karşı {{warranty_period}} garanti verilmektedir. Garanti kapsamında tespit edilen hatalar ücretsiz olarak giderilecektir."
                    },
                    "support_section": {
                        "title": "Teknik Destek",
                        "content": "Fuar süresince 7/24 teknik destek hattımız hizmetinizdedir.\n\nAcil Destek: {{support_phone}}\nE-posta: {{support_email}}"
                    },
                    "exclusions": {
                        "title": "Garanti Dışı Durumlar",
                        "items": [
                            "Normal kullanım kaynaklı aşınma ve yıpranma",
                            "Müşteri kaynaklı hasar",
                            "Üçüncü şahısların müdahalesi",
                            "Doğal afetler ve mücbir sebepler"
                        ]
                    }
                },
                "en": {
                    "title": "Warranty and After-Sales Support",
                    "warranty_section": {
                        "title": "Warranty Coverage",
                        "content": "A {{warranty_period}} warranty is provided against manufacturing and workmanship defects. Defects identified under warranty will be rectified free of charge."
                    },
                    "support_section": {
                        "title": "Technical Support",
                        "content": "Our 24/7 technical support line is at your service during the fair.\n\nEmergency Support: {{support_phone}}\nEmail: {{support_email}}"
                    },
                    "exclusions": {
                        "title": "Warranty Exclusions",
                        "items": [
                            "Normal wear and tear",
                            "Customer-caused damage",
                            "Third-party intervention",
                            "Natural disasters and force majeure"
                        ]
                    }
                }
            },
            "placeholders": ["warranty_period", "support_phone", "support_email"],
            "styles": {}
        }
    },
    
    # ===================== TERMS & CONDITIONS TEMPLATES =====================
    {
        "module_type": "terms_conditions",
        "template_name": "Standart Koşullar",
        "description": "Genel şartlar ve koşullar",
        "thumbnail_url": "/templates/terms_standard.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "standard",
            "default_text": {
                "tr": {
                    "title": "Genel Şartlar ve Koşullar",
                    "sections": [
                        {"title": "1. Teklif Geçerliliği", "content": "Bu teklif, belirtilen geçerlilik tarihine kadar geçerlidir. Bu tarihten sonra fiyatlar ve koşullar değişebilir."},
                        {"title": "2. Sipariş Onayı", "content": "Sipariş, müşterinin yazılı onayı ve ilk ödemenin alınmasıyla kesinleşir."},
                        {"title": "3. Tasarım Değişiklikleri", "content": "Tasarım onayından sonra yapılacak değişiklikler ek maliyet ve süre gerektirebilir."},
                        {"title": "4. Teslimat", "content": "Teslimat tarihleri tahminidir ve mücbir sebepler nedeniyle değişebilir."},
                        {"title": "5. İptal", "content": "Sipariş iptali durumunda, yapılan çalışma oranında kesinti uygulanır."},
                        {"title": "6. Fikri Mülkiyet", "content": "Tüm tasarımların fikri mülkiyet hakları ödeme tamamlanana kadar firmamıza aittir."},
                        {"title": "7. Uyuşmazlıklar", "content": "Anlaşmazlık durumunda {{jurisdiction}} mahkemeleri yetkilidir."}
                    ]
                },
                "en": {
                    "title": "General Terms and Conditions",
                    "sections": [
                        {"title": "1. Proposal Validity", "content": "This proposal is valid until the specified validity date. Prices and conditions may change after this date."},
                        {"title": "2. Order Confirmation", "content": "The order is confirmed upon written approval by the customer and receipt of the first payment."},
                        {"title": "3. Design Changes", "content": "Changes requested after design approval may require additional cost and time."},
                        {"title": "4. Delivery", "content": "Delivery dates are estimates and may change due to force majeure."},
                        {"title": "5. Cancellation", "content": "In case of order cancellation, deductions will be applied based on the work completed."},
                        {"title": "6. Intellectual Property", "content": "Intellectual property rights of all designs belong to our company until payment is completed."},
                        {"title": "7. Disputes", "content": "In case of disputes, {{jurisdiction}} courts shall have jurisdiction."}
                    ]
                }
            },
            "placeholders": ["jurisdiction"],
            "styles": {}
        }
    },
    
    # ===================== CONTACT TEMPLATES =====================
    {
        "module_type": "contact",
        "template_name": "İletişim Kartı",
        "description": "İletişim bilgileri ve yetkili kişi",
        "thumbnail_url": "/templates/contact_card.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "card",
            "default_text": {
                "tr": {
                    "title": "İletişim",
                    "subtitle": "Sorularınız için bize ulaşın",
                    "contact_person_label": "İlgili Kişi",
                    "company_label": "Firma",
                    "address_label": "Adres",
                    "phone_label": "Telefon",
                    "email_label": "E-posta",
                    "website_label": "Web"
                },
                "en": {
                    "title": "Contact",
                    "subtitle": "Reach out to us for any questions",
                    "contact_person_label": "Contact Person",
                    "company_label": "Company",
                    "address_label": "Address",
                    "phone_label": "Phone",
                    "email_label": "Email",
                    "website_label": "Website"
                }
            },
            "placeholders": ["sales_person_name", "sales_person_title", "sales_person_phone", "sales_person_email", "company_name", "company_address", "company_phone", "company_email", "company_website"],
            "styles": {}
        }
    },
    
    # ===================== ATTACHMENTS TEMPLATES =====================
    {
        "module_type": "attachments",
        "template_name": "Ek Dökümanlar",
        "description": "Ek dosya ve belgelerin listesi",
        "thumbnail_url": "/templates/attachments_list.png",
        "is_system": True,
        "is_active": True,
        "display_order": 1,
        "content": {
            "layout": "list",
            "default_text": {
                "tr": {
                    "title": "Ekler",
                    "subtitle": "Bu teklife ek olarak sunulan belgeler",
                    "attachment_types": [
                        "3D Render Görselleri",
                        "Teknik Çizimler",
                        "Malzeme Örnekleri",
                        "Sertifikalar",
                        "Referans Mektupları",
                        "Sigorta Belgeleri"
                    ]
                },
                "en": {
                    "title": "Attachments",
                    "subtitle": "Documents provided as appendix to this proposal",
                    "attachment_types": [
                        "3D Render Images",
                        "Technical Drawings",
                        "Material Samples",
                        "Certificates",
                        "Reference Letters",
                        "Insurance Documents"
                    ]
                }
            },
            "placeholders": ["attachment_files"],
            "styles": {}
        }
    }
]

async def seed_templates():
    """Seed module templates into database"""
    try:
        # Check if already seeded
        count = await db.module_templates.count_documents({"is_system": True})
        if count > 0:
            print(f"✓ Templates already seeded ({count} templates)")
            return
        
        # Add IDs and timestamps
        now = datetime.now(timezone.utc)
        for template in TEMPLATES:
            template["id"] = str(uuid.uuid4())
            template["user_id"] = None  # System template
            template["created_at"] = now
            template["updated_at"] = now
        
        # Insert all templates
        result = await db.module_templates.insert_many(TEMPLATES)
        print(f"✓ Seeded {len(result.inserted_ids)} module templates successfully")
        
    except Exception as e:
        print(f"✗ Error seeding templates: {str(e)}")

if __name__ == "__main__":
    asyncio.run(seed_templates())
