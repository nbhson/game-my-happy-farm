import { useState } from 'react';
import { OUTFITS, WING_MAX_LV, WING_UP, wingLvName } from '../game/data';
import { useGame } from '../game/store';
import { sfx } from '../game/audio';
import { GameIcon } from './GameIcon';
import { OutfitPreview } from './ItemPreview';

function LvStars({ lv }: { lv: number }) {
  return (
    <span className="text-amber-500 font-black" title={`Lv${lv} ${wingLvName(lv)}`}>
      {'★'.repeat(lv)}{'☆'.repeat(WING_MAX_LV - lv)}
    </span>
  );
}

export default function SmithModal() {
  const s = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  const wings = Object.values(OUTFITS).filter((o) => o.slot === 'wing' && o.id !== 'wing_none');
  const owned = wings.filter((w) => s.ownedOutfits.includes(w.id));
  const locked = wings.filter((w) => !s.ownedOutfits.includes(w.id));

  return (
    <div>
      <div className="bg-gradient-to-r from-orange-600 to-red-700 border-2 border-black rounded-xl px-3 py-2 text-white text-center mb-2">
        <div className="font-black">🔨 LÒ RÈN BÁC THỢ RÈN</div>
        <div className="text-xs opacity-90">
          Ví: <b className="text-yellow-300">{s.xu} xu</b> • <b className="text-sky-300">{s.gem} gem</b> — cánh mua ở shop mặc định Lv1, rèn tối đa Lv5!
        </div>
      </div>

      <div className="bg-stone-100 border-2 border-black rounded-lg p-2 mb-2 text-[12px] font-bold text-stone-700">
        Tỉ lệ rèn: Lv2 <b className="text-green-700">90%</b> • Lv3 <b className="text-yellow-700">50%</b> • Lv4 <b className="text-orange-700">10%</b> • Lv5 <b className="text-red-700">1%</b> — rớt giữ nguyên Lv (vẫn mất phí). Cánh Lv càng cao càng to + hào quang càng xịn!
      </div>

      {msg && <div className="bg-yellow-100 border-2 border-yellow-600 rounded-lg p-2 mb-2 text-[13px] font-extrabold text-center">{msg}</div>}

      {owned.length === 0 && (
        <p className="text-sm text-stone-500 text-center bg-white border-[3px] border-dashed border-stone-300 rounded-xl p-4">
          Chưa có cánh nào! Ghé Shop Thời trang (khu mua sắm) mua cánh rồi quay lại rèn nhé 🪽
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {owned.map((w) => {
          const lv = Math.max(1, Math.min(WING_MAX_LV, s.wingLv[w.id] ?? 1));
          const maxed = lv >= WING_MAX_LV;
          const cost = maxed ? null : WING_UP[lv + 1];
          const worn = s.outfit.wing === w.id;
          return (
            <div key={w.id} className={`border-[3px] rounded-xl p-2 text-center ${worn ? 'bg-yellow-100 border-yellow-500' : 'bg-white border-black'}`}>
              <div className="flex justify-center bg-[#f3efe4] border-2 border-black rounded-lg py-1">
                <OutfitPreview slot="wing" itemId={w.id} size={72} level={lv} />
              </div>
              <div className="font-extrabold text-[13px]">{w.name} {worn && '✅'}</div>
              <div className="text-[12px]"><LvStars lv={lv} /> <span className="font-bold text-purple-700">Lv{lv} {wingLvName(lv)}</span></div>
              {maxed ? (
                <div className="text-[12px] font-black text-red-600 mt-1">👑 MAX — xịn nhất làng!</div>
              ) : (
                <>
                  <div className="text-[12px] font-bold text-stone-600 mt-1">
                    Lên Lv{lv + 1}: <span className="inline-flex items-center gap-0.5">{cost!.xu}<GameIcon name="coin" size={12} /></span>
                    {cost!.gem > 0 && <span className="inline-flex items-center gap-0.5"> +{cost!.gem}<GameIcon name="gem" size={12} /></span>}
                    {' '}• <b>{Math.round(cost!.rate * 100)}%</b>
                  </div>
                  <button
                    className="pixel-btn !text-[11px] !px-2 !py-1.5 w-full mt-1"
                    onClick={() => {
                      sfx.click();
                      const r = s.upgradeWing(w.id);
                      setMsg(r.msg);
                    }}
                  >
                    🔨 Rèn lên Lv{lv + 1}
                  </button>
                </>
              )}
              {!worn && (
                <button onClick={() => s.wearOutfit(w.id)} className="pixel-btn !text-[10px] !px-2 !py-1 !bg-sky-300 w-full mt-1">Mặc cánh này</button>
              )}
            </div>
          );
        })}
      </div>

      {locked.length > 0 && (
        <div className="mt-2">
          <div className="font-black text-[13px] mb-1">🔒 Chưa sở hữu (mua ở Shop Thời trang):</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {locked.map((w) => (
              <div key={w.id} className="bg-stone-100 border-2 border-stone-400 rounded-lg p-2 text-center opacity-80">
                <div className="flex justify-center"><GameIcon name={w.id} size={36} /></div>
                <div className="font-extrabold text-[12px]">{w.name}</div>
                <div className="text-[11px] text-stone-500">{w.priceGem ? `${w.priceGem} gem` : `${w.priceXu} xu`}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="pixel-btn !text-[10px] !bg-stone-300 mt-2" onClick={() => useGame.getState().setModal(null)}>Đóng</button>
    </div>
  );
}
