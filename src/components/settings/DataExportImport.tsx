import { useRef } from 'react';
import { Button } from '../ui/Button';
import { STORAGE_KEYS } from '../../hooks/useLocalStorage';

export function DataExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // Collect all app data from localStorage
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    // Get all storage keys
    Object.values(STORAGE_KEYS).forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          exportData[key] = JSON.parse(value);
        } catch {
          exportData[key] = value;
        }
      }
    });

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinic-scheduler-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        // Validate it's our export format
        if (!importData.version) {
          alert('File không hợp lệ. Vui lòng chọn file đã xuất từ ứng dụng.');
          return;
        }

        // Import each storage key
        Object.values(STORAGE_KEYS).forEach((key) => {
          if (importData[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(importData[key]));
          }
        });

        alert('Nhập dữ liệu thành công! Trang sẽ được tải lại.');
        window.location.reload();
      } catch {
        alert('Lỗi khi đọc file. Vui lòng kiểm tra file và thử lại.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExport} variant="secondary">
          Xuất dữ liệu (Export)
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          id="import-file"
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Nhập dữ liệu (Import)
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Xuất dữ liệu để gửi cho hỗ trợ kỹ thuật hoặc sao lưu. Nhập dữ liệu sẽ ghi đè dữ liệu hiện tại.
      </p>
    </div>
  );
}
