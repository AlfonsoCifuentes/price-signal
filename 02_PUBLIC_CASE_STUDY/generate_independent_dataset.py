#!/usr/bin/env python3
"""Generate an invented educational-publishing catalogue from scratch (no input files are read).
Deliberately plants data-quality challenges. Every name and price is fictional; the seed controls replay.
"""
from pathlib import Path
import csv,json,collections,statistics,random,re

ROOT=Path(__file__).resolve().parent
RNG=random.Random(20261011)
LF=chr(10)  # LF on every OS so output hashes are identical on Windows, macOS and Linux
FAMILIES=[
 ('Mosaic English','Adult','Upper Secondary', 'CEFR'),
 ('Northstar Language Lab','Adult','General', 'CEFR'),
 ('Fable Road','Primary','Primary', 'Grades'),
 ('Little Lanterns','Primary','Pre-Primary','Grades'),
 ('Glasshouse English','Teen','Secondary','CEFR'),
 ('Compass Junction','Teen','Secondary','CEFR'),
 ('Wildflower Words','Primary','Primary','Grades'),
 ('Silverline Skills','Adult','General','CEFR'),
 ('Driftwood Dialogues','Adult','General','CEFR'),
 ('Kindred Horizons','Teen','Secondary','CEFR'),
 ('Amber Path','Primary','Primary','Grades'),
 ('Orion Exam Prep','Adult','Exam Preparation','CEFR'),
]
LEVELS={'CEFR':['Starter','A1','A2','B1','B2','C1'],'Grades':['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6']}
RAW=['Series','Segment','Sub-Segment','Title','Price_EUR']
ENH=RAW[:-1]+['Edition','Level','Level_System','Product_Type','Product_Role','Book_Part','Pack_Type','Answer_Support','Digital_Main_Book_Access','Digital_Practice_Book_Access','Audio_Access','App_Access','Additional_Resources','Access_Duration','Price_EUR']
assert len(ENH)==19
# Role is derived from type only. TB stays blank on purpose: the abbreviation is unresolved.
ROLE={'Student Book':'Core','Pupil Book':'Core','Workbook':'Practice','Digital Workbook':'Digital Practice','Resource':'Supplementary'}
rows=[]
def euros(eur):
    return round(eur+.49,2)
def add(series,segment,sub,title,level,levelsys,ptype,base, **attrs):
    r={k:'' for k in ENH};r.update({'Series':series,'Segment':segment,'Sub-Segment':sub,'Title':title,'Price_EUR':f'{base:.2f}',
      'Level':level,'Level_System':levelsys,'Product_Type':ptype,'Product_Role':ROLE.get(ptype,'')})
    r.update(attrs);rows.append(r)

for i,(series,seg,sub,sys) in enumerate(FAMILIES):
    levels=LEVELS[sys]
    pb='Pupil Book' if seg=='Primary' else 'Student Book'
    # family-level base prices drawn from the seeded RNG
    p_student=euros(38+(i%5)*4+RNG.randint(0,4))
    p_work=euros(18+(i%4)*3+RNG.randint(0,5))
    p_digital=euros(45+(i%6)*3+RNG.randint(0,4))
    for j,lv in enumerate(levels):
        early=(lv=='Starter' and i in (0,7))
        student=euros(p_student-0.49-(8 if early else 0))
        workbook=euros(p_work-0.49-(4 if early else 0))
        digital=p_digital
        add(series,seg,sub,f'{series} {lv} {pb}',lv,sys,pb,student)
        add(series,seg,sub,f'{series} {lv} Workbook with Audio',lv,sys,'Workbook',workbook,Audio_Access='Yes')
        add(series,seg,sub,f'{series} {lv} Digital Workbook Access',lv,sys,'Digital Workbook',digital,Digital_Practice_Book_Access='Yes',Access_Duration=('18 months' if j in (0,3) and i in (0,4,8) else ''))
        # Restricted set of families have both standard and enhanced digital bundles
        if i in (0,2,4,7,9):
            pkg=euros(p_student-0.49+11)
            pr=euros(pkg-0.49+17+(i%3)*2)
            add(series,seg,sub,f'{series} {lv} Study Pack with Digital',lv,sys,'Student Book',pkg,Pack_Type='Study Pack',Digital_Main_Book_Access='Yes',Additional_Resources='Practice cards')
            add(series,seg,sub,f'{series} {lv} Premium Pack with Digital',lv,sys,'Student Book',pr,Pack_Type='Premium Pack',Digital_Main_Book_Access='Yes',Additional_Resources='Practice cards + assessment library')
        if i in (1,5,8,10):
            # versioned paired solution access, same price, with distinct titles
            add(series,seg,sub,f'{series} {lv} Workbook with Key',lv,sys,'Workbook',workbook,Answer_Support='With Key')
            add(series,seg,sub,f'{series} {lv} Workbook without Key',lv,sys,'Workbook',workbook,Answer_Support='Without Key')
        if i in (3,6):
            whole=euros(p_student-0.49+4)
            half=euros((whole-0.49)*0.565)
            add(series,seg,sub,f'{series} {lv} {pb} Complete',lv,sys,pb,whole,Book_Part='Full')
            add(series,seg,sub,f'{series} {lv} {pb} Part A',lv,sys,pb,half,Book_Part='A')
            add(series,seg,sub,f'{series} {lv} {pb} Part B',lv,sys,pb,half,Book_Part='B')

# Add deliberately plausible commercial + lexical problems; all invented
add('Orion Exam Prep','Adult','Exam Preparation','Orion Exam Prep B2 TB Premium Pack','B2','CEFR','TB',euros(108),Pack_Type='Premium Pack')
add('Fable Road','Primary','Primary','Fable Road Level 3 Gleebook Resource','Level 3','Grades','Resource',euros(14),Additional_Resources='Gleebook')
# Wrong series metadata but title prefix points to an alternate invented family
rows[19]['Series']='Glasshouse English'
rows[154]['Series']='Kindred Horizons'
# Inconsistent segment hierarchy
next(r for r in rows if r['Segment']=='Primary')['Sub-Segment']='Secondary'
# Two representations of edition
for k in [100,101,102]:rows[k]['Edition']='Second Edition'
for k in [103,104,105]:rows[k]['Edition']='2nd Edition'
# Vary naming conventions for one digital bundle
for r in rows:
    if r['Series']=='Mosaic English' and 'Study Pack with Digital' in r['Title']:
        r['Title']=r['Title'].replace('Study Pack with Digital','Study Pack + Online Access')

# build independent log of planted issues, never claim dataset represents live pricing
with (ROOT/'public_raw_catalogue.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=RAW,lineterminator=LF);w.writeheader();w.writerows([{k:r[k] for k in RAW} for r in rows])
with (ROOT/'public_enriched_catalogue.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=ENH,lineterminator=LF);w.writeheader();w.writerows(rows)

prices=[float(r['Price_EUR']) for r in rows]
bytype=collections.defaultdict(list)
for r in rows: bytype[r['Product_Type']].append(float(r['Price_EUR']))
# price consistency across levels by safe group attributes; editions are intentionally separated
GROUP=['Series','Product_Type','Product_Role','Book_Part','Pack_Type','Answer_Support','Digital_Main_Book_Access','Digital_Practice_Book_Access','Additional_Resources','Edition']
groups=collections.defaultdict(list)
for r in rows:groups[tuple(r[k] for k in GROUP)].append(r)
comps=[v for v in groups.values() if len(set(x['Level'] for x in v))>1]
consistent=sum(len(set(float(v['Price_EUR']) for v in g))==1 for g in comps)
prob=[{'issue':'Series metadata contradicts title prefix','row_id':idx+1,'title':r['Title'],'series_field':r['Series']} for idx,r in enumerate(rows) if not r['Title'].startswith(r['Series'])]
assert len(prob)==2,prob
support=collections.defaultdict(list)
for r in rows:
    if r['Answer_Support']:
        key=(r['Series'],r['Level'],r['Product_Type'],r['Edition']);support[key].append(r)
pairs=[group for group in support.values() if {'With Key','Without Key'}==set(x['Answer_Support'] for x in group)]
assert all(g[0]['Price_EUR']==g[1]['Price_EUR'] for g in pairs)
summary={
 'name':'PRICE / SIGNAL', 'dataset':'Independent fictional demonstration / no real business information',
 'seed':20261011,'products':len(rows),'series':len(set(r['Series'] for r in rows)),
 'source_columns':len(RAW),'enriched_columns':len(ENH),
 'avg_price':round(statistics.mean(prices),2),'median_price':round(statistics.median(prices),2),
 'min_price':min(prices),'max_price':max(prices),'price_points':len(set(prices)),
 'level_comparables':len(comps),'level_consistent':consistent,
 'level_consistency_pct':round(100*consistent/len(comps),1),
 'with_without_key_pairs':len(pairs),'series_mismatches':len(prob),
 'series_mismatch_rows':prob,
 'category_stats':[{'name':name,'count':len(pp),'avg':round(statistics.mean(pp),2)} for name,pp in sorted(bytype.items(),key=lambda v:-len(v[1]))],
 'range_buckets':[{'label':label,'count':sum(lo<=p<hi for p in prices)} for label,lo,hi in [('Under €30',0,30),('€30–44',30,45),('€45–59',45,60),('€60–74',60,75),('€75–99',75,100),('€100+',100,100000)]],
 'challenges':[
   {'id':'prefix','label':'Mislabelled collections','severity':'data integrity','count':2, 'rule':'Check the title prefix against the assigned product family. Investigate; never auto-correct the source.'},
   {'id':'edition','label':'Edition aliases','severity':'normalisation', 'rule':'Second Edition and 2nd Edition are parallel labels; make reporting alias without overwriting input.'},
   {'id':'ebook','label':'False digital-access match','severity':'parsing', 'rule':'Gleebook is a print resource name containing the substring ebook. Token-agnostic matching is unsafe.'},
   {'id':'packs','label':'Inconsistent bundle wording','severity':'classification','rule':'Study Pack with Digital and Study Pack + Online Access may require business validation before merging.'},
   {'id':'segment','label':'Taxonomy drift','severity':'hierarchy','rule':'A Primary product is mistakenly labelled Secondary in the subsegment field.'},
   {'id':'tb','label':'Premium TB outlier','severity':'commercial QA','rule':'TB is an ambiguous abbreviation and carries a price outlier; investigate, do not automatically exclude.'},
   {'id':'access','label':'Incomplete access duration','severity':'missingness','rule':'Only some products explicitly say 18 months; blank is unspecified, not unlimited.'},
   {'id':'split','label':'Part A + B premium','severity':'like-for-like','rule':'Buying parts individually costs more than a single full volume; compare only matched product families and levels.'},
   {'id':'starter','label':'Level-specific starter prices','severity':'exceptions','rule':'Starter differs from upper levels for two selected product families; may reflect strategy rather than error.'},
   {'id':'solutions','label':'Answer support parity','severity':'matched pairs','rule':'The solution-key pairs are the same fictional list price; verify matching on edition and level.'}
 ]
}
(ROOT/'public_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+LF,encoding='utf-8',newline=LF)
(ROOT/'public_findings.json').write_text(json.dumps(summary['challenges'],ensure_ascii=False,indent=2)+LF,encoding='utf-8',newline=LF)
print(json.dumps({k:summary[k] for k in ['products','series','level_comparables','level_consistent','with_without_key_pairs','avg_price']},indent=2))
