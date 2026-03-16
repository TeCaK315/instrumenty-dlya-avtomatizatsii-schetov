-- Создание таблицы счетов
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    client_data JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы логов действий со счетами
CREATE TABLE IF NOT EXISTS invoice_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_invoice_id ON invoice_logs(invoice_id);

-- Настройка RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для таблицы invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для таблицы invoice_logs
CREATE POLICY "Users can view logs for own invoices" ON invoice_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_logs.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for own invoices" ON invoice_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_logs.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического определения просроченных счетов
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices 
    SET status = 'overdue'
    WHERE status = 'sent' 
    AND due_date < CURRENT_DATE;
END;
$$ language 'plpgsql';

-- Можно настроить cron job для периодического выполнения:
-- SELECT cron.schedule('update-overdue-invoices', '0 1 * * *', 'SELECT update_overdue_invoices();');