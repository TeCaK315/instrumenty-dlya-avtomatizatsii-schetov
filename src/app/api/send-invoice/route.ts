export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, clientEmail, invoiceData } = await request.json();

    if (!invoiceId || !clientEmail || !invoiceData) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные данные' },
        { status: 400 }
      );
    }

    // Здесь должна быть интеграция с email-сервисом (например, Resend)
    // Для демонстрации просто обновляем статус счета
    
    const supabase = await createClient();
    
    // Обновляем статус счета на "отправлен"
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      throw updateError;
    }

    // В реальном приложении здесь был бы код отправки email:
    /*
    const emailContent = generateEmailContent(invoiceData);
    await sendEmail({
      to: clientEmail,
      subject: `Счет ${invoiceData.invoiceNumber}`,
      html: emailContent,
      attachments: [generatePDFAttachment(invoiceData)]
    });
    */

    // Логируем отправку
    await supabase
      .from('invoice_logs')
      .insert([{
        invoice_id: invoiceId,
        action: 'sent',
        details: { recipient: clientEmail },
        created_at: new Date().toISOString()
      }]);

    return NextResponse.json({ 
      success: true, 
      message: 'Счет успешно отправлен' 
    });

  } catch (error) {
    console.error('Ошибка отправки счета:', error);
    return NextResponse.json(
      { error: 'Ошибка при отправке счета' },
      { status: 500 }
    );
  }
}

function generateEmailContent(invoiceData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Счет ${invoiceData.invoiceNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #5a67d8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .invoice-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; color: #5a67d8; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Счет ${invoiceData.invoiceNumber}</h1>
        </div>
        
        <div class="content">
            <p>Здравствуйте, ${invoiceData.client.name}!</p>
            
            <p>Направляем вам счет на оплату:</p>
            
            <div class="invoice-details">
                <p><strong>Номер счета:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Дата:</strong> ${new Date(invoiceData.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Срок оплаты:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString('ru-RU')}</p>
                <p class="total"><strong>Сумма к оплате:</strong> ₽${invoiceData.total.toFixed(2)}</p>
            </div>
            
            <p>Детали счета:</p>
            <ul>
                ${invoiceData.items.map((item: any) => 
                  `<li>${item.description} - ${item.quantity} шт. × ₽${item.rate} = ₽${item.amount.toFixed(2)}</li>`
                ).join('')}
            </ul>
            
            ${invoiceData.notes ? `<p><strong>Примечания:</strong> ${invoiceData.notes}</p>` : ''}
            
            <p>Спасибо за сотрудничество!</p>
        </div>
    </body>
    </html>
  `;
}