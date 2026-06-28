export const printGradeReport = (
  student: any,
  evaluations: any[],
  subjects: any[],
  classes: any[],
  type: string,
  dateStr: string
) => {
  if (!student) return;

  const exs = evaluations.filter(
    (ev) =>
      ev.studentId === student.id &&
      (type === 'monthly' ? ev.date.startsWith(dateStr.slice(0, 7)) : ev.date === dateStr)
  );
  const generalNote = exs.find((e) => e.notes)?.notes || '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html dir="rtl">
    <head>
      <title>شهادة تقييم - ${student.name}</title>
      <style>
        body { font-family: Tahoma, Arial, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
        .cert-container { background: #fff; padding: 40px; border-radius: 20px; border: 8px solid #4f46e5; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { color: #4f46e5; margin: 0 0 10px 0; font-size: 2.5em; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 1.1em; background: #f1f5f9; padding: 15px; border-radius: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
        th { background-color: #f8fafc; color: #475569; }
        .color-box { display: inline-block; width: 20px; height: 20px; border-radius: 4px; vertical-align: middle; margin-left: 8px; }
        .notes { background: #fffbeb; padding: 20px; border-radius: 10px; border: 1px solid #fde68a; margin-bottom: 30px; }
        .footer { display: flex; justify-content: space-between; margin-top: 50px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="header">
          <h1>شهادة تطور ومهارات الطفل</h1>
          <p>${type === 'monthly' ? 'التقييم الشهري المنتظم' : 'التقييم التتبعي'}</p>
        </div>
        <div class="info">
          <div><strong>اسم الطفل:</strong> ${student.name}</div>
          <div><strong>الفصل/المجموعة:</strong> ${classes.find((c) => c.id === student.classroomId)?.name || '-'}</div>
          <div><strong>التاريخ:</strong> ${type === 'monthly' ? dateStr.slice(0, 7) : dateStr}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>المهارة / المادة</th>
              <th>التصنيف</th>
              <th>التقييم</th>
            </tr>
          </thead>
          <tbody>
            ${subjects
              .map((sub) => {
                const evalRecs = exs.filter((e) => e.subjectId === sub.id);
                if (evalRecs.length === 0) return '';
                const ev = evalRecs[evalRecs.length - 1];

                let ratingHTML = '-';
                if (sub.evaluationMethod === 'score' && ev.grade) ratingHTML = `<strong>${ev.grade}</strong>`;
                else if (sub.evaluationMethod === 'color' && ev.colorRating) {
                  const colorMap: any = { green: '#10b981', yellow: '#eab308', red: '#ef4444' };
                  const textMap: any = { green: 'ممتاز', yellow: 'مقبول', red: 'يحتاج تحسين' };
                  ratingHTML = `<span class="color-box" style="background: ${colorMap[ev.colorRating]}"></span> <span>${textMap[ev.colorRating]}</span>`;
                } else if (sub.evaluationMethod === 'text' && ev.textRating) {
                  ratingHTML = ev.textRating;
                }

                return `
                  <tr>
                    <td><strong>${sub.name}</strong></td>
                    <td>${sub.category === 'academic' ? 'أكاديمي' : sub.category === 'behavioral' ? 'سلوكي' : 'أنشطة'}</td>
                    <td>${ratingHTML}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>

        ${generalNote ? `
        <div class="notes">
          <strong style="color: #b45309; display: block; margin-bottom: 8px;">ملاحظات الإدارة والمعلمة:</strong>
          <p style="margin: 0;">${generalNote}</p>
        </div>
        ` : ''}

        <div class="footer">
          <div>توقيع المعلمة: ........................</div>
          <div>إدارة الحضانة: ........................</div>
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
