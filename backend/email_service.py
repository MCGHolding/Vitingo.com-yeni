import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, HtmlContent, PlainTextContent
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Get SendGrid API key from environment
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not found in environment variables")
        
        self.sender_email = os.environ.get('SENDER_EMAIL', 'info@quattrostand.com')
        self.sg = SendGridAPIClient(self.api_key) if self.api_key else None

    def send_survey_invitation(self, customer_data: dict, project_data: dict, survey_link: str) -> dict:
        """Send survey invitation email to customer"""
        try:
            if not self.sg:
                logger.error("SendGrid client not initialized - missing API key")
                return {"success": False, "error": "Email service not configured"}

            # Create personalized email content
            subject = f"{project_data['fairName']} - Müşteri Memnuniyet Anketi"
            
            html_content = self._generate_survey_email_html(customer_data, project_data, survey_link)
            plain_content = self._generate_survey_email_text(customer_data, project_data, survey_link)

            # Create SendGrid mail object
            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Quattro Stand"),
                to_emails=To(customer_data['email']),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )

            # Send email
            response = self.sg.send(message)
            
            logger.info(f"Survey invitation sent to {customer_data['email']} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "Survey invitation sent successfully"
            }

        except Exception as e:
            logger.error(f"Failed to send survey invitation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def send_test_email(self, to_email: str) -> dict:
        """Send test email to verify SendGrid configuration"""
        try:
            if not self.sg:
                return {"success": False, "error": "Email service not configured"}

            subject = "Vitingo CRM - Test Email"
            html_content = """
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">✅ Test Email Başarılı!</h1>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h2 style="color: #333;">Merhaba!</h2>
                        <p style="color: #555; line-height: 1.6; font-size: 16px;">
                            Bu bir test emailidir. SendGrid entegrasyonu başarıyla çalışıyor! 🎉
                        </p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin-top: 0;">Test Detayları:</h3>
                            <ul style="color: #555; line-height: 1.8;">
                                <li><strong>Gönderen:</strong> info@quattrostand.com</li>
                                <li><strong>Servis:</strong> SendGrid API</li>
                                <li><strong>Tarih:</strong> {current_date}</li>
                                <li><strong>Sistem:</strong> Vitingo CRM</li>
                            </ul>
                        </div>
                        
                        <p style="color: #555; line-height: 1.6;">
                            Artık müşteri memnuniyet anketlerini gerçek email olarak gönderebilirsiniz!
                        </p>
                    </div>
                    
                    <div style="background: #333; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">
                            Vitingo CRM | Fuar Stand Üretim ve Tasarım
                        </p>
                    </div>
                </body>
            </html>
            """.replace("{current_date}", self._get_current_date())

            plain_content = f"""
            Vitingo CRM - Test Email

            Merhaba!

            Bu bir test emailidir. SendGrid entegrasyonu başarıyla çalışıyor!

            Test Detayları:
            - Gönderen: info@quattrostand.com  
            - Servis: SendGrid API
            - Tarih: {self._get_current_date()}
            - Sistem: Vitingo CRM

            Artık müşteri memnuniyet anketlerini gerçek email olarak gönderebilirsiniz!

            Vitingo CRM | Fuar Stand Üretim ve Tasarım
            """

            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Test"),
                to_emails=To(to_email),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )

            response = self.sg.send(message)
            
            logger.info(f"Test email sent to {to_email} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": f"Test email sent successfully to {to_email}"
            }

        except Exception as e:
            logger.error(f"Failed to send test email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def _generate_survey_email_html(self, customer_data: dict, project_data: dict, survey_link: str) -> str:
        """Generate HTML content for survey invitation email"""
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Değerli Görüşünüz Bizim İçin Önemli!</h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <p style="font-size: 16px; color: #333;">Sayın <strong>{customer_data['contact']}</strong>,</p>
                    
                    <p style="color: #555; line-height: 1.6;">
                        <strong>{project_data['fairName']}</strong> fuarı için hazırladığımız stand projenizle ilgili deneyiminizi öğrenmek istiyoruz.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #333; margin-top: 0;">Proje Detayları:</h3>
                        <ul style="color: #555; line-height: 1.8;">
                            <li><strong>Proje:</strong> {project_data['name']}</li>
                            <li><strong>Fuar:</strong> {project_data['fairName']}</li>
                            <li><strong>Lokasyon:</strong> {project_data['city']}, {project_data['country']}</li>
                            <li><strong>Teslimat Tarihi:</strong> {self._format_date(project_data['deliveryDate'])}</li>
                        </ul>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6;">
                        Anketi tamamlamanız yaklaşık <strong>3-5 dakika</strong> sürecektir. 
                        Görüşleriniz gelecekteki projelerimizi daha da iyileştirmemize yardımcı olacaktır.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{survey_link}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            🗳️ Ankete Başla
                        </a>
                    </div>
                    
                    <p style="color: #777; font-size: 14px; text-align: center;">
                        Bu anket linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.
                    </p>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">
                        Vitingo CRM | Fuar Stand Üretim ve Tasarım<br>
                        info@quattrostand.com
                    </p>
                </div>
            </body>
        </html>
        """

    def _generate_survey_email_text(self, customer_data: dict, project_data: dict, survey_link: str) -> str:
        """Generate plain text content for survey invitation email"""
        return f"""
        Değerli Görüşünüz Bizim İçin Önemli!

        Sayın {customer_data['contact']},

        {project_data['fairName']} fuarı için hazırladığımız stand projenizle ilgili deneyiminizi öğrenmek istiyoruz.

        Proje Detayları:
        - Proje: {project_data['name']}
        - Fuar: {project_data['fairName']} 
        - Lokasyon: {project_data['city']}, {project_data['country']}
        - Teslimat Tarihi: {self._format_date(project_data['deliveryDate'])}

        Anketi tamamlamanız yaklaşık 3-5 dakika sürecektir. Görüşleriniz gelecekteki projelerimizi daha da iyileştirmemize yardımcı olacaktır.

        Ankete başlamak için aşağıdaki linke tıklayın:
        {survey_link}

        Bu anket linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.

        Vitingo CRM | Fuar Stand Üretim ve Tasarım
        info@quattrostand.com
        """

    def _format_date(self, date_string: str) -> str:
        """Format date string to Turkish locale"""
        try:
            from datetime import datetime
            date_obj = datetime.fromisoformat(date_string)
            return date_obj.strftime("%d.%m.%Y")
        except:
            return date_string

    def _get_current_date(self) -> str:
        """Get current date in Turkish format"""
        from datetime import datetime
        return datetime.now().strftime("%d.%m.%Y %H:%M")

# Global email service instance
email_service = EmailService()