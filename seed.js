// seed.js
const { db, hashPw } = require('./db');

// İstifadəçi artıq varsa, yenidən hash hesablamır və xəta atmır
const mk = (role, name, email) => {
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) return existing.id;

  const { salt, hash } = hashPw('demo1234');
  db.prepare('INSERT INTO users(role,name,email,salt,hash) VALUES(?,?,?,?,?)')
    .run(role, name, email, salt, hash);
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  return user ? user.id : null;
};

const kids = [
  ['Aysel', 0.40], ['Elvin', 0.10], ['Nigar', 0.55], ['Rəşad', 0.35],
  ['Leyla', 0.12], ['Murad', 0.65], ['Səbinə', 0.28], ['Orxan', 0.50],
  ['Ülviyyə', 0.05], ['Kamran', 0.58], ['Zeynəb', 0.20], ['Tural', 0.40]
];
const topics = [['Adi kəsrlər', 1.4], ['Onluq kəsrlər', 0.8], ['Kəsrlərin müqayisəsi', 0.6]];
const types = ['concept', 'calculation', 'gap'];
const needs = ['none', 'none', 'dyslexia', 'none', 'none', 'vision', 'none', 'none', 'none', 'hearing', 'none', 'none'];

const ins = db.prepare('INSERT INTO attempts(child_id,topic,error_type,solved) VALUES(?,?,?,?)');

// Hamısı bir tranzaksiyada: daha sürətlidir və xəta olsa yarımçıq data qalmır
const seed = db.transaction(() => {
  // 1. Müəllimi yarat və ya ID-sini götür
  const t = mk('teacher', 'Tamerlan müəllim', 'tamerlan@demo.az');

  // 2. Sinfi yarat (yoxdursa)
  const classObj = db.prepare('SELECT id FROM classes WHERE code=?').get('5A-DEMO');
  let cid = classObj ? classObj.id : null;
  if (!cid && t) {
    cid = db.prepare('INSERT INTO classes(name,code,teacher_id) VALUES(?,?,?)')
      .run('5a', '5A-DEMO', t).lastInsertRowid;
  }

  // 3. Şagirdlər və valideynlər
  kids.forEach(([name, base], i) => {
    const p = mk('parent', `${name} valideyni`, `parent${i + 1}@demo.az`);
    if (!p || !cid) return;

    const child = db.prepare('SELECT id FROM children WHERE parent_id=? AND name=?').get(p, `${name} M.`);
    if (child) return; // artıq var, təkrar yaratma

    const id = db.prepare('INSERT INTO children(parent_id,class_id,name,needs) VALUES(?,?,?,?)')
      .run(p, cid, `${name} M.`, needs[i]).lastInsertRowid;

    // Yalnız yeni yaradılan şagirdlər üçün cəhdlər
    for (let k = 0; k < 15; k++) {
      const [topic, w] = topics[Math.floor(Math.random() * topics.length)];
      const wrong = Math.random() < Math.min(base * w, 0.9);
      ins.run(id, topic, wrong ? types[Math.floor(Math.random() * 3)] : 'none', wrong ? 0 : 1);
    }
  });
});

seed();
console.log('Seed tamamlandı');
