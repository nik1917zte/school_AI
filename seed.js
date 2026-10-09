// seed.js
const { db, hashPw } = require('./db');

const mk = (role, name, email) => {
  const { salt, hash } = hashPw('demo1234');
  // Email artıq varsa xəta atmasın deyə INSERT OR IGNORE istifadə edirik
  db.prepare('INSERT OR IGNORE INTO users(role,name,email,salt,hash) VALUES(?,?,?,?,?)').run(role, name, email, salt, hash);
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  return user ? user.id : null;
};

// 1. Müəllimi yarat və ya ID-sini götür
const t = mk('teacher', 'Tamerlan müəllim', 'tamerlan@demo.az');

// 2. Sinfi yarat (yoxdursa)
let classObj = db.prepare("SELECT id FROM classes WHERE code='5A-DEMO'").get();
let cid = classObj ? classObj.id : null;
if (!cid && t) {
  cid = db.prepare("INSERT INTO classes(name,code,teacher_id) VALUES('5a','5A-DEMO',?)").run(t, '5a', '5A-DEMO', t).lastInsertRowid;
}

// 3. Şagirdlər və Valideynlər
const kids = [
  ['Aysel', 0.40], ['Elvin', 0.10], ['Nigar', 0.55], ['Rəşad', 0.35],
  ['Leyla', 0.12], ['Murad', 0.65], ['Səbinə', 0.28], ['Orxan', 0.50],
  ['Ülviyyə', 0.05], ['Kamran', 0.58], ['Zeynəb', 0.20], ['Tural', 0.40]
];
const topics = [['Adi kəsrlər', 1.4], ['Onluq kəsrlər', 0.8], ['Kəsrlərin müqayisəsi', 0.6]];
const types = ['concept', 'calculation', 'gap'];
const needs = ['none', 'none', 'dyslexia', 'none', 'none', 'vision', 'none', 'none', 'none', 'hearing', 'none', 'none'];

const ins = db.prepare('INSERT INTO attempts(child_id,topic,error_type,solved) VALUES(?,?,?,?)');

kids.forEach(([name, base], i) => {
  const email = `parent${i + 1}@demo.az`;
  const p = mk('parent', `${name} valideyni`, email);

  if (p && cid) {
    // Şagirdin artıq bazada olub-olmadığını yoxlayırıq
    let child = db.prepare('SELECT id FROM children WHERE parent_id=? AND name=?').get(p, `${name} M.`);
    let id = child ? child.id : null;

    if (!id) {
      id = db.prepare('INSERT INTO children(parent_id,class_id,name,needs) VALUES(?,?,?,?)').run(p, cid, `${name} M.`, needs[i]).lastInsertRowid;

      // Yalnız yeni yaradılan şagirdlər üçün cəhdləri generasiya edirik
      for (let k = 0; k < 15; k++) {
        const [topic, w] = topics[Math.floor(Math.random() * topics.length)];
        const wrong = Math.random() < Math.min(base * w, 0.9);
        ins.run(id, topic, wrong ? types[Math.floor(Math.random() * 3)] : 'none', wrong ? 0 : 1);
      }
    }
  }
});

console.log('Demo data tam hazır vəziyyətdədir!');
console.log('Müəllim: tamerlan@demo.az / demo1234');
console.log('Valideyn: parent1@demo.az / demo1234');
console.log('Sinif kodu: 5A-DEMO');
