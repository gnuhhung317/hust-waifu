import calendar
from datetime import date

def working_days_by_month(year: int) -> dict[int, int]:
    """
    Tính số ngày công mỗi tháng:
    - Tính tất cả các ngày T2..T6
    - +1 cho THỨ BẢY thuộc các ngày 1..7 của tháng (nếu có)
    """
    result = {}
    for month in range(1, 13):
        days = calendar.monthrange(year, month)[1]  # số ngày trong tháng
        count = 0
        added_first_sat = False
        for d in range(1, days + 1):
            wd = date(year, month, d).weekday()  # 0=Mon ... 6=Sun
            if wd <= 4:               # T2..T6
                count += 1
            if not added_first_sat and d <= 7 and wd == 5:  # Thứ Bảy đầu tháng
                count += 1
                added_first_sat = True
        result[month] = count
    return result

# Ví dụ: in bảng cho năm 2025
if __name__ == "__main__":
    year = 2025
    data = working_days_by_month(year)
    for m in range(1, 13):
        print(f"{year}-{m:02d}: {data[m]} ngày công")
