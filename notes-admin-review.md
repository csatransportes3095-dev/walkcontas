# Admin Panel Review Notes

## Current AdminPanel.tsx (707 lines)
- Has hardcoded password gate (Walk@@3095admin)
- 5 tabs: Cards & Serviços, Configurações, PIX, Senhas VIP, Cupons
- CardsManager: full CRUD for cards, models, docs with expand/collapse
- SiteSettingsManager: key/value editor for 11 settings
- PixManager: key/value editor for 3 PIX fields
- PasswordsManager: create/delete VIP codes
- CouponsManager: create/delete coupons

## What's already working in AdminPanel:
- Card create/edit/delete/toggle active
- Model create/edit/delete/toggle active (nested under cards)
- Document create/edit/delete/toggle active (nested under cards)
- Site settings editing (title, subtitle, hero, whatsapp, promo, etc)
- PIX settings editing
- Password management
- Coupon management

## What's missing (from todo.md):
- [ ] Aba Modelos por Card: ativar/desativar modelos - ALREADY EXISTS in CardsManager!
- [ ] Aba Imagens: gerenciar imagens do hero e cards - Need image upload UI
- [ ] Aba Documentos: ativar/desativar docs - ALREADY EXISTS in CardsManager!
- [ ] Aba Garantias: editar texto de garantia por card - ALREADY EXISTS in card edit!
- [ ] Conectar Home.tsx ao banco de dados - DONE (just completed)
- [ ] Testar fluxo completo admin → site

## What actually needs to be done:
1. Add image upload functionality to cards (currently just URL input)
2. Add borderColor editing to card edit form
3. Invalidate publicData queries when admin makes changes
4. Mark completed items in todo.md
5. Test the full flow
6. Write tests
