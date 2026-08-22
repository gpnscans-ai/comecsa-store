-- Agrega 'kushki' como metodo de pago valido (payments.method)
alter type payment_method add value if not exists 'kushki';
