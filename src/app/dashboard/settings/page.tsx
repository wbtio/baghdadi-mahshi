'use client';

import { useEffect, useState } from 'react';
import { supabase, Settings } from '@/lib/supabase';
import { Save, Store, Phone, Clock, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    restaurant_name: '',
    description_ar: '',
    address: '',
    phone: '',
    whatsapp: '',
    working_hours: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    logo_url: '',
    cover_image_url: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
        setFormData({
          restaurant_name: data.restaurant_name || '',
          description_ar: data.description_ar || '',
          address: data.address || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          working_hours: data.working_hours || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          logo_url: data.logo_url || '',
          cover_image_url: data.cover_image_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (settings) {
        const { error } = await supabase
          .from('settings')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert(formData);

        if (error) throw error;
      }

      alert('تم حفظ الإعدادات بنجاح');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إعدادات المطعم</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-6 h-6 text-[#d4a574]" />
            <h2 className="text-lg font-bold">المعلومات الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المطعم
              </label>
              <input
                type="text"
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="محشي البغدادي"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="البصرة الجزائر شارع جامع الموسوي"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المطعم
              </label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574] resize-none"
                placeholder="أول مطعم مختص بالدجاج المحشي في البصرة..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-6 h-6 text-[#d4a574]" />
            <h2 className="text-lg font-bold">معلومات التواصل</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="07xxxxxxxxx"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الواتساب
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="9647xxxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-[#d4a574]" />
            <h2 className="text-lg font-bold">أوقات العمل</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              أوقات العمل
            </label>
            <input
              type="text"
              value={formData.working_hours}
              onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
              placeholder="من 1 ظهراً إلى 12 ليلاً"
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="w-6 h-6 text-[#d4a574]" />
            <h2 className="text-lg font-bold">روابط التواصل الاجتماعي</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                فيسبوك
              </label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                انستغرام
              </label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تيك توك
              </label>
              <input
                type="url"
                value={formData.tiktok_url}
                onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="https://tiktok.com/..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-6 h-6 text-[#d4a574]" />
            <h2 className="text-lg font-bold">الصور</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الشعار
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="https://..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط صورة الغلاف
              </label>
              <input
                type="url"
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#d4a574] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#b8956a] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}
