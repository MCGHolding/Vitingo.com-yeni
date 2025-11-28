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
    
    # Continue with remaining templates in next message due to length...
]

# Add remaining templates (will be added in implementation)
# This is Part 1 of the seed file

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
